import os
import re
import json
import pika
from datetime import datetime

from sqlalchemy.sql import between
from sqlalchemy.orm import eagerload
from genshi.template import TemplateLoader
from z3c.rml import rml2pdf

from pyramid.response import Response
from pyramid.view import view_config
from pyramid_rpc.jsonrpc import jsonrpc_method
from pyramid.httpexceptions import HTTPNotFound

from hm.lib.config import siteConfig

from weblibs.rabbitmq import pool
from weblibs.jsonrpc import marshall, RPCUserError

from webmodel import Shipment, ShipmentPackage
from webmodel.consts import PACKAGE_STATUS

from .base import RpcBase, DocBase
from .region import getRegionName
from .cainiao import getWaybill, updateWaybill, cancelWaybill


class ShipmentJSON(RpcBase):
    @jsonrpc_method(endpoint='rpc', method='shipment.search')
    def searchShipment(self, cond):
        """ By default the search returns shipment thats are not closed, except
        when orderStatus is explicitly set.

        The `cond` parameter is a dictionary containing the following keys:
            startDate
            endDate
            dateType: 0 - scheduled  1 - actual
            shipmentStatus
            shipmentId
        """
        start_date = datetime.strptime(cond['startDate'], '%Y-%m-%d')
        end_date = datetime.strptime(cond['endDate'], '%Y-%m-%d')

        if cond['dateType'] == 0:
            date_type = Shipment.scheduledShippingDate
        else:
            date_type = Shipment.actualShippingDate

        shipmentId = cond.get('shipmentId')
        if shipmentId and not 10000000 <= shipmentId <= 99999999:
            raise RPCUserError('发货单号错误！')

        if start_date > end_date:
            raise RPCUserError('结束日期必须大于起始日期！')

        query = self.sess.query(Shipment)

        # for vendors, restrict search to their own shipments
        user = self.request.user
        if user.isVendor:
            query = query.filter_by(senderId=user.partyId)

        if shipmentId:
            query = query.filter_by(shipmentId=shipmentId)
        else:
            query = query.filter(
                between(date_type, start_date, end_date)
            )

            if cond.get('shipmentStatus'):
                query = query.filter_by(shipmentStatus=cond['shipmentStatus'])

        fields = [
            'shipmentId', 'actualShippingDate', 'shipmentStatus',
            'recipientName', 'scheduledShippingDate', 'shipmentMemo',
            'shipmentMethod', 'shipperCode'
        ]

        return [marshall(s, fields) for s in query.all()]

    @jsonrpc_method(endpoint='rpc', method='shipment.data')
    def data(self, shipmentId):
        shipment = self.sess.query(Shipment).options(
            eagerload('skus.item'),
            eagerload('packages')
        ).get(shipmentId)

        headerFields = [
            'shipmentId', 'actualShippingDate', 'shipmentStatus',
            'recipientName', 'recipientMobile', 'recipientPhone',
            'scheduledShippingDate', 'shipmentMemo', 'shipmentMethod',
            'shipperCode', 'streetAddress', 'regionCode'
        ]

        header = marshall(shipment, headerFields)
        header['regionName'] = getRegionName(shipment.regionCode)

        return {
            'header': header,
            'skus': [{
                'pos': sku.pos,
                'skuId': sku.skuId,
                'quantity': sku.quantity,
                'weight': sku.item.weight,
                'itemName': sku.item.itemName,
                'unitId': sku.item.unitId,
                'model': sku.item.model,
                'specification': sku.item.specification,
            } for sku in shipment.skus],
            'packages': [{
                'documentId': package.documentId,
                'printTime': package.printTime,
                'weight': package.weight,
                'freight': package.freight,
                'packageStatus': package.packageStatus
            } for package in shipment.packages]
        }

    @jsonrpc_method(endpoint='rpc', method='shipment.waybill.get')
    def getNewWaybill(self, shipmentId):
        """ Request a new waybill for the shipment """

        shipment = self.sess.query(Shipment)\
            .options(eagerload('skus.item'))\
            .get(shipmentId)

        waybill = getWaybill(shipment)

        shipment.packages.append(ShipmentPackage(
            shipperCode=shipment.shipperCode,
            documentId=waybill['data']['waybillCode']
        ))

        return waybill

    @jsonrpc_method(endpoint='rpc', method='shipment.waybill.reprint')
    def reprintWaybill(self, shipperCode, documentId):
        """ Request the reprint data for the given waybill """
        package = self.sess.query(ShipmentPackage).get(
            (shipperCode, documentId)
        )

        if not package:
            raise RPCUserError('该面单不存在。')

        status = package.packageStatus
        if status and status >= PACKAGE_STATUS.IN_TRANSIT:
            raise RPCUserError('该面单已收件，无法重新打印。')

        return updateWaybill(shipperCode, documentId)

    @jsonrpc_method(endpoint='rpc', method='shipment.waybill.markPrinted')
    def markWaybillAsPrinted(self, shipperCode, documentId):
        """ Mark the given waybill as printed if the package status is not set.
        Otherwise just change the print time.
        """
        package = self.sess.query(ShipmentPackage).get(
            (shipperCode, documentId)
        )

        package.printTime = datetime.now()
        if not package.packageStatus:
            package.packageStatus = PACKAGE_STATUS.PRINTED
        return datetime.now()

    @jsonrpc_method(endpoint='rpc', method='shipment.waybill.cancel')
    def cancelWaybill(self, shipperCode, documentId):
        """ Request the reprint data for the given waybill """

        package = self.sess.query(ShipmentPackage).get(
            (shipperCode, documentId)
        )

        if not package:
            raise RPCUserError('该面单不存在。')

        status = package.packageStatus
        if status and status > PACKAGE_STATUS.SCANNED:
            raise RPCUserError('该面单已收件，无法取消。')

        ret = cancelWaybill(shipperCode, documentId)
        self.sess.delete(package)
        return ret

    @jsonrpc_method(endpoint='rpc', method='shipment.waybill.scan')
    def scanWaybill(self, scanCode):
        """ Handles the scanning of the QR code on the waybill. The scan code
        must be in the format::

          SH,{shipmentId},{documentId}

        The package indicated by the scan code would be marked as scanned
        """
        match = re.match(r'^SH,(\d{8}),(\d+)$', scanCode)

        if not match:
            raise RPCUserError('无法识别的二维码。')

        shipmentId, documentId = match.groups()

        shipment = self.sess.query(Shipment).get(shipmentId)
        if not shipment:
            raise RPCUserError('发货单号错误。')

        package = self.sess.query(ShipmentPackage).get(
            (shipment.shipperCode, documentId)
        )

        if not package:
            raise RPCUserError('该面单号不存在或已取消。')

        if package.packageStatus == PACKAGE_STATUS.PRINTED:
            package.packageStatus = PACKAGE_STATUS.SCANNED

        ret = {
            'shipmentId': shipmentId,
            'waybillCode': documentId
        }

        with pool.acquire() as cnx:
            cnx.channel.basic_publish(
                exchange='shipment',
                routing_key='package.scanned',
                body=json.dumps(ret),
                properties=pika.BasicProperties(
                    headers={
                        'x-delay': int(siteConfig.package_scan_delay) * 1000
                    },
                    delivery_mode=2,  # make message persistent
                )
            )

        return ret

    @jsonrpc_method(endpoint='rpc', method='shipment.package.weight.set')
    def setPackageWeight(self, shipmentId, documentId, weight):
        """ Set the weight for the given package.

        Note the weight of a package can be set any time after the waybill
        is scanned.
        """

        shipment = self.sess.query(Shipment).get(shipmentId)
        if not shipment:
            raise RPCUserError('发货单号错误。')

        package = self.sess.query(ShipmentPackage).get(
            (shipment.shipperCode, documentId)
        )

        if not package:
            raise RPCUserError('该面单号不存在或已取消。')

        status = package.packageStatus
        if not status or status < PACKAGE_STATUS.SCANNED:
            raise RPCUserError('该面单号尚未扫描。')

        package.weight = weight


class ShipmentDocView(DocBase):
    """ The view used for creating the picking list of the shipment """

    def __init__(self, context, request):
        super(ShipmentDocView, self).__init__(context, request)

        sid = int(request.matchdict['shipmentid'])
        self.shipment = self.sess.query(Shipment).get(sid)
        if not self.shipment:
            raise HTTPNotFound()

    @property
    def shippingAddress(self):
        return getRegionName(self.shipment.regionCode) + \
            (self.shipment.streetAddress or '')

    def getConsolidatedSku(self):
        """ A shipment may contain multiple sku lines for the same sku item.
        This function adds the quantity for the same sku id and returns line
        items with non-zero quantity. Used in printing picking list.

        :returns: A list of dictionary with 'sku_id', 'unit_id', 'item_name',
            'model', 'quantity', 'brand_id'
        """

        # calculated consolidated quantity
        sid = self.shipment.shipmentId
        SQL = """
select sku_id, i.brand_id, i.item_name, i.model, i.unit_id,
sum(ss.quantity) as quantity
from shipment_sku ss inner join item_master i on ss.sku_id = i.item_id
where shipment_id = %d and is_sku = true
group by sku_id, i.item_name, i.model, i.unit_id, i.brand_id
having sum(ss.quantity)<>0
"""
        r = self.sess.execute(SQL % sid)

        consolidated = {}
        for row in r.fetchall():
            consolidated[row.sku_id] = dict(row)

        shipment = self.sess.query(Shipment).get(sid)

        ret = []
        # helper to keep track of items already added to ret from consolidated
        skuids = []

        # sort the result using the sku item order in the shipment
        for sku in shipment.skus:
            if sku.skuId in consolidated and sku.skuId not in skuids:
                ret.append(consolidated[sku.skuId])
                skuids.append(sku.skuId)
        return ret

    @view_config(route_name='shipment_doc')
    def shipmentDoc(self):
        loader = TemplateLoader([os.path.dirname(__file__)])
        tmpl = loader.load('shipment.rml')
        stream = tmpl.generate(
            shipment=self.shipment,
            view=self,
            skus=self.getConsolidatedSku())
        body = rml2pdf.parseString(stream.render()).read()

        response = Response(
            content_type='application/pdf',
            content_length=len(body),
            body=body)
        return response
