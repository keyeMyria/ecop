import os.path
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy.sql import and_, not_, func, select, update
from sqlalchemy.orm import eagerload
from genshi.template import TemplateLoader
from z3c.rml import rml2pdf

from pyramid.response import Response
from pyramid.httpexceptions import HTTPNotFound
from pyramid.view import view_config
from pyramid_rpc.jsonrpc import jsonrpc_method

from hm.lib.config import siteConfig

from webmodel.consts import ORDER_STATUS, ORDER_TYPE
from webmodel.item import Item
from webmodel.order import Order, SalesOrder, PurchaseOrder
from webmodel.payment import Payment, OrderPayment
from webmodel.sms import SMSGateway
from weblibs.jsonrpc import marshall, RPCUserError

from .base import RpcBase, DocBase
from .region import getRegionName


def findItemById(o, oiid):
    for i in o.items:
        if i.orderItemId == oiid:
            return i
    return None


class OrderJSON(RpcBase):
    def loadOrder(self, orderId):
        """ The result of this factory shall not be cached to ensure it remains
        in the current database session """
        try:
            assert 10001000 < orderId < 99999999
        except Exception:
            raise HTTPNotFound()

        order = self.sess.query(Order).get(orderId)
        if order is None:
            raise HTTPNotFound()
        return order

    @jsonrpc_method(endpoint='rpc', method='order.sales.data')
    def getSalesOrderData(self, order):
        """ Returns the JSON representation of the order. """
        if isinstance(order, int):
            order = self.loadOrder(order)

        fields = [
            'orderId', 'customerId', 'createTime', 'amount',
            'freight', 'rebate', 'orderStatus', 'regionCode', 'recipientName',
            'streetAddress', 'recipientMobile', 'recipientPhone', 'memo',
            'internalMemo', 'paidAmount', 'completionDate',
            'installmentAmount', 'attachments', 'effectiveCost'
        ]

        header = marshall(order, fields, ignoreNone=False)

        oi_fields = ['orderItemId', 'itemId', 'itemName', 'specification',
            'model', 'quantity', 'unitId', 'sellingPrice', 'unitCost', 'pos']

        order.payments.sort(key=lambda op: op.payment.payTime)
        # a flush won't reload the order, so order item position change will
        # not automatically be updated, hence sort again
        order.items.sort(key=lambda oi: oi.pos)

        return {
            'header': header,
            'items': [marshall(oi, oi_fields) for oi in order.items],
            'payments': [{
                'paymentId': op.paymentId,
                'amount': op.amount,
                'paymentMethod': op.payment.paymentMethod,
                'payTime': op.payment.payTime,
                'creatorName': op.payment.creator.partyName \
                    if op.payment.creator else None
            } for op in order.payments]
        }

    def updateOrderChange(self, order, modifications):
        for i in modifications.get('deleted', []):
            item = findItemById(order, i)
            if item:
                order.items.remove(item)
                self.sess.delete(item)

        for i in modifications.get('modified', []):
            oi = findItemById(order, i[0])
            if oi:
                oi.quantity = Decimal(str(i[1]['quantity']))
                oi.sellingPrice = Decimal(str(i[1]['sellingPrice']))
                oi.unitCost = Decimal(str(i[1]['unitCost']))
                oi.itemName = i[1]['itemName'].strip()
                oi.specification = i[1]['specification'].strip() or None
                oi.model = i[1]['model'].strip() or None
                oi.pos = i[1]['pos']
                oi.unitId = i[1]['unitId']

        for i in modifications.get('added', []):
            order.addItem(
                itemId=i[0],
                itemName=i[1]['itemName'].strip(),
                specification=i[1]['specification'].strip() or None,
                model=i[1]['model'].strip() or None,
                quantity=Decimal(str(i[1]['quantity'])),
                unitId=i[1]['unitId'],
                sellingPrice=Decimal(str(i[1]['sellingPrice'])),
                unitCost=Decimal(str(i[1]['unitCost']))
            )

        order.updateTotals()

    @jsonrpc_method(endpoint='rpc', method='order.sales.upsert')
    def upsertSalesOrder(self, orderId, modifications):
        """
        Modify an existing order or create a new one.

        The parameter `modifications` is a dictionary containing 'header' for
        all modified header fields. 'added' is a list of item id's to be added
        to the order. 'deleted' is list of order item id's to be removed from
        the order. 'modified' is a list of fields changes for changed items.
        Example input:
        {
            "header": {
                "freight":50,
                "regionCode":230103,
                "recipientMobile":"18621830376"
            },
            "deleted":[55556],
            "modified":[[55564, {"quantity": 2, "sellingPrice": 500.5}]],
            "added":[[10018201,{"quantity": 1, "sellingPrice": 1350}]]}]
        }

        Returns a **complete** JSON representation of the modified order as
        would be returned by order.sales.data
        """
        if isinstance(orderId, str):
            newOrder = True
            order = SalesOrder(creatorId=self.request.user.partyId)
            self.sess.add(order)
        else:
            newOrder = False
            order = self.loadOrder(orderId)

        modifiedFields = modifications['header']
        newStatus = modifiedFields.pop('orderStatus', None)

        for (k, v) in modifiedFields.items():
            if newOrder and not v:
                continue
            setattr(order, k, Decimal(str(v)) if isinstance(v, float) else v)

        self.updateOrderChange(order, modifications)

        # change of order status needs special handling, and the checking shall
        # be done after all other order changes
        if newStatus:
            self.changeSalesOrderStatus(order, newStatus)

        # flush first so that trigger based field can be populated
        self.sess.flush()
        return self.getSalesOrderData(order)

    def changeSalesOrderStatus(self, order, new):
        old = order.orderStatus
        if old == new:
            return

        # completionDate is set the first time an order is set to be completed
        if new == ORDER_STATUS.COMPLETED:
            if order.amount != order.paidAmount:
                raise RPCUserError('订单金额和收款金额不一致，不能完成订单！')

            query = self.sess.query(PurchaseOrder).filter(and_(
                PurchaseOrder.relatedOrderId == order.orderId,
                not_(PurchaseOrder.orderStatus.in_(
                    (ORDER_STATUS.COMPLETED, ORDER_STATUS.CLOSED)))
            ))
            orders = query.all()
            if orders:
                raise RPCUserError('该订单对应的采购订单未完成！')

            if not order.completionDate:
                order.completionDate = date.today()

        elif new == ORDER_STATUS.CLOSED:
            # we assume that whenever there is non-zero actual cost, there is
            # some completed purchase order related sales order
            if order.actualCost:
                raise RPCUserError('供应商订单已完成，不能关闭销售订单！')

            order.completionDate = None

        order.orderStatus = new

    @jsonrpc_method(endpoint='rpc', method='order.sales.search')
    def searchOrder(self, cond):
        """
        By default the search returns orders that are not closed, except
        when orderStatus is explicitly set. And if customerId is given without
        explicit orderStatus, show all orders of the customer.

        The `cond` parameter is a dictionary containing the following keys:
            dateType   # 1 = creationDate, 2 = completionDate
            startDate
            endDate
            orderId
            orderStatus
            customerId
        """
        query = self.sess.query(SalesOrder).options(eagerload('creator'))

        if cond.get('orderId'):
            orderId = int(cond['orderId'])
            assert 10000000 <= orderId <= 99999999, '无效订单号。'
            o = query.get(orderId)
            orders = [o] if o else []
        else:
            if 'startDate' in cond or 'endDate' in cond:
                # when any date is present, dateType must be present
                if cond['dateType'] == 1:
                    dateField = Order.createTime
                else:
                    dateField = Order.completionDate

            if 'startDate' in cond:
                start_date = datetime.strptime(cond['startDate'], '%Y-%m-%d')
                query = query.filter(dateField >= start_date)

            if 'endDate' in cond:
                end_date = datetime.strptime(cond['endDate'], '%Y-%m-%d')
                query = query.filter(dateField < end_date + timedelta(1))

            if 'startDate' in cond and 'endDate' in cond and \
                start_date > end_date:
                raise RPCUserError('结束日期必须大于起始日期！')

            # By default only show orders of interest, i.e. not closed or
            # completed, except when:
            #  * order stauts is given
            #  * customerId is given, then show all orders of the customer
            if cond.get('dateType') == 2: # completed
                query = query.filter_by(orderStatus=ORDER_STATUS.COMPLETED)
            elif cond.get('orderStatus'):
                query = query.filter(Order.orderStatus == cond['orderStatus'])
            elif not cond.get('customerId'):
                query = query.filter(and_(
                    Order.orderStatus != ORDER_STATUS.CLOSED,
                    Order.orderStatus != ORDER_STATUS.COMPLETED))

            if cond['customerId']:
                query = query.filter(Order.customerId == cond['customerId'])

            orders = query.all()

        fields = [
            'orderId', 'createTime', 'completionDate', 'amount', 'paidAmount',
            'orderStatus', 'effectiveCost', 'customerName', 'creatorName',
            'recipientName'
        ]

        return [marshall(o, fields) for o in orders]

    @jsonrpc_method(endpoint='rpc', method='order.price.get')
    def getItemPrice(self, itemIds, priceType):
        """
        Given a list of item ids, return the C-price or B-price based on
        parameter priceType. The return values is a dictionary mapping item id
        to requested price
        """
        itemIds = set(itemIds)
        items = self.sess.query(Item).filter(Item.itemId.in_(itemIds))
        return dict([
            (i.itemId, i.sellingPriceB if priceType == 'B'else i.sellingPrice)
            for i in items
        ])

    @jsonrpc_method(endpoint='rpc', method='order.payment.add')
    def addOrderPayment(self, orderId, payDate, method, amount):
        """ Offline payment initialized by staff """
        order = self.loadOrder(orderId)
        if not amount:
            raise RPCUserError('收款金额不能为0')

        amount = Decimal(str(amount))
        payDate = datetime.strptime(payDate, '%Y-%m-%d')

        if order.orderStatus == ORDER_STATUS.BID:
            order.orderStatus = ORDER_STATUS.PAID
        order.paidAmount += amount
        order.installmentAmount = None

        payment = Payment(
            amount=amount,
            payTime=payDate,
            partyId=order.customerId,
            paymentMethod=method,
            creatorId=self.request.user.partyId
        )

        self.sess.add(payment)
        self.sess.flush()

        self.sess.add(OrderPayment(
            orderId=order.orderId,
            paymentId=payment.paymentId,
            amount=amount
        ))

    @jsonrpc_method(endpoint='rpc', method='order.payment.delete')
    def deleteOrderPayment(self, orderId, paymentId):
        """ Remove an offline payment initialized by staff """
        order = self.loadOrder(orderId)
        op = None

        for op in order.payments:
            if op.paymentId == paymentId:
                break

        if op:
            assert op.payment.creatorId, 'Payment creator shall not be none'
            order.paidAmount -= op.amount
            order.payments.remove(op)
            self.sess.delete(op.payment)
            self.sess.delete(op)

    @jsonrpc_method(endpoint='rpc', method='order.attachment.add')
    def uploadAttachment(self):
        """ Add the given file as the last attachment of the order """

    @jsonrpc_method(endpoint='rpc', method='order.attachment.set')
    def setAttachment(self):
        pass

    @jsonrpc_method(endpoint='rpc', method='order.notify.preview')
    def previewOrderNotification(self, orderId, messageType):
        order = self.loadOrder(orderId)
        return order.getNotificationText(messageType)

    @jsonrpc_method(endpoint='rpc', method='order.notify.send')
    def sendOrderNotification(self, orderId, messageType):
        order = self.loadOrder(orderId)
        assert messageType in (
            'order.created', 'order.changed', 'order.completed')

        if messageType == 'order.completed' and order.payableAmount <= 0:
            raise RPCUserError('该订单无应付金额!')

        SMSGateway().sendTemplateMessage(
            order.customer.mobile or order.recipientMobile,
            messageType,
            (order.customerName or order.recipientName,
             order.orderId,
             order.shortUrl)
        )

    @jsonrpc_method(endpoint='rpc', method='order.purchase.data')
    def getPurchaseOrderData(self, order):
        """ Returns the JSON representation of the order. """
        if isinstance(order, int):
            order = self.loadOrder(order)
        assert isinstance(order, PurchaseOrder)

        fields = [
            'orderId', 'supplierId', 'customerId', 'createTime', 'amount',
            'rebate', 'freight', 'orderStatus', 'regionCode', 'recipientName',
            'streetAddress', 'recipientMobile', 'recipientPhone', 'memo',
            'completionDate', 'supplierName', 'creatorName', 'paidAmount'
        ]

        header = marshall(order, fields)
        oi_fields = ['orderItemId', 'itemId', 'itemName', 'specification',
            'model', 'quantity', 'unitId', 'sellingPrice', 'pos']

        order.payments.sort(key=lambda op: op.payment.payTime)
        # a flush won't reload the order, so order item position change will
        # not automatically be updated, hence sort again
        order.items.sort(key=lambda oi: oi.pos)

        return {
            'header': header,
            'items': [marshall(oi, oi_fields) for oi in order.items],
            'payments': [{
                'paymentId': op.paymentId,
                'amount': op.amount,
                'paymentMethod': op.payment.paymentMethod,
                'payTime': op.payment.payTime,
                'creatorName': op.payment.creator.partyName \
                    if op.payment.creator else None
            } for op in order.payments]
        }

    def changePurchaseOrderStatus(self, order, new):
        old = order.orderStatus
        if old == new:
            return

        if new == ORDER_STATUS.CLOSED and order.paidAmount:
            raise RPCUserError('已结算订单不能关闭！')

        if new == ORDER_STATUS.COMPLETED and not order.completionDate:
            order.completionDate = date.today()

        order.orderStatus = new

        #
        # Whenever purchase order status changes to or from `completed`, update
        # sales order actualCost
        #
        if ORDER_STATUS.COMPLETED in (new, old):
            # flush the status change first so that it will be captured by the
            # following query
            self.sess.flush()

            cost = select([func.sum(PurchaseOrder.amount)]).where(and_(
                PurchaseOrder.orderStatus == ORDER_STATUS.COMPLETED,
                PurchaseOrder.orderType == ORDER_TYPE.PURCHASE,
                PurchaseOrder.relatedOrderId == order.relatedOrderId
            ))
            self.sess.execute(update(SalesOrder).where(
                SalesOrder.orderId == order.relatedOrderId
            ).values(actual_cost=cost.as_scalar()))

    @jsonrpc_method(endpoint='rpc', method='order.purchase.upsert')
    def upsertPurchaseOrder(self, orderId, modifications):
        if isinstance(orderId, str):
            newOrder = True
            order = PurchaseOrder(creatorId=self.request.user.partyId)
            self.sess.add(order)
        else:
            newOrder = False
            order = self.loadOrder(orderId)

        modifiedFields = modifications['header']
        newStatus = modifiedFields.pop('orderStatus', None)

        for (k, v) in modifiedFields.items():
            if newOrder and not v:
                continue
            setattr(order, k, Decimal(str(v)) if isinstance(v, float) else v)

        self.updateOrderChange(order, modifications)

        # change of order status needs special handling, and the checking shall
        # be done after all other order changes
        if newStatus:
            self.changePurchaseOrderStatus(order, newStatus)

        self.sess.flush()
        return self.getPurchaseOrderData(order)

    @jsonrpc_method(endpoint='rpc', method='order.sales.getPurchaseOrder')
    def getPurchaseOrder(self, orderId):
        """
        Return the header information of purchase orders related to the
        given sales order.
        """
        query = self.sess.query(PurchaseOrder).\
            filter_by(relatedOrderId=orderId)
        orders = query.all()
        fields = [
            'orderId', 'createTime', 'completionDate', 'amount', 'paidAmount',
            'orderStatus', 'creatorName', 'supplierName'
        ]
        return [marshall(o, fields) for o in orders]


@view_config(route_name='order_download')
class OrderPDFDownload(DocBase):
    def __init__(self, context, request):
        super(OrderPDFDownload, self).__init__(context, request)

        self.order = self.sess.query(Order)\
            .get(int(request.matchdict['orderid']))
        if not self.order:
            raise HTTPNotFound()

    @property
    def mobileAndPhone(self):
        ret = None
        mobile = self.order.recipientMobile
        phone = self.order.recipientPhone
        if mobile:
            ret = mobile
            if phone and phone != mobile:
                ret = ret + ' / ' + phone
            if len(ret) > 36:
                ret = mobile
        elif phone:
            ret = phone
        return ret

    @property
    def regionName(self):
        return getRegionName(self.order.regionCode)

    @property
    def siteUrl(self):
        """ The url that points to the desktop version of web """
        return siteConfig.canonical_url

    def __call__(self):
        loader = TemplateLoader([os.path.dirname(__file__)])
        if self.order.orderType == ORDER_TYPE.SALES:
            tmplName = 'sales_order.rml'
            prefix = 'SO'
        else:
            tmplName = 'purchase_order.rml'
            prefix = 'PO'

        tmpl = loader.load(tmplName)
        stream = tmpl.generate(order=self.order, view=self)
        body = rml2pdf.parseString(stream.render()).read()

        response = Response(
            content_type='application/pdf',
            content_disposition='filename="%s%s.pdf"' % (
                prefix, self.order.orderId),
            content_length=len(body),
            body=body)
        return response
