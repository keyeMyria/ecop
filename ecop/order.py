import os.path
from datetime import date, datetime, timedelta
from decimal import Decimal
from sqlalchemy.sql import and_, text, or_
from sqlalchemy.orm import eagerload
from genshi.template import TemplateLoader
from z3c.rml import rml2pdf

from pyramid.response import Response
from pyramid.httpexceptions import HTTPNotFound
from pyramid.view import view_config
from pyramid_rpc.jsonrpc import jsonrpc_method

from hm.lib.config import siteConfig

from webmodel import (
    Item, GetParamByKey, PartyCoupon, Order, Coupon, Payment, OrderPayment
)
from webmodel.consts import ORDER_STATUS

from weblibs.jsonrpc import marshall, RPCUserError

from .base import RpcBase, DocBase


def changeOrderStatus(order, old, new):
    if old == new:
        return

    if old == ORDER_STATUS.PARTIAL_DELIVERY and new != ORDER_STATUS.COMPLETED:
        raise RPCUserError('部分发货的订单状态只能修改为已完成！')

    if old == ORDER_STATUS.COMPLETED:
        raise RPCUserError('已完成的订单不能修改成其他状态！')

    order.orderStatus = new

    # completionDate is set the first time an order is set to be completed
    if new == ORDER_STATUS.COMPLETED and not order.completionDate:
        order.completionDate = date.today()


class OrderJSON(RpcBase):
    order = None  # the current order

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

        self.order = order
        return order

    @jsonrpc_method(endpoint='rpc', method='order.data')
    def data(self, orderId):
        """ Returns the JSON representation of the order. """
        order = self.loadOrder(orderId)

        # if coupon was used on the order for payment but still not paid,
        # check if the coupon has expired
        if order.orderStatus == ORDER_STATUS.BID and order.couponUid and \
                date.today() > order.coupon.endDate:
            self._releaseCoupon()

        fields = [
            'orderId', 'customerId', 'createTime', 'shippingDate', 'amount',
            'freight', 'rebate', 'orderStatus', 'regionCode', 'recipientName',
            'streetAddress', 'recipientMobile', 'recipientPhone', 'memo',
            'internalMemo', 'couponUid', 'couponAmount', 'freightCost',
            'completionDate'
        ]

        header = marshall(order, fields)
        if order.orderStatus == ORDER_STATUS.COMPLETED and order.shipperCode:
            header['logisticsInfo'] = '%s %s' % (
                GetParamByKey('shipper', order.shipperCode),
                order.shippingDocId
            )

        fields = ['orderItemId', 'itemId', 'itemName', 'specification',
                  'model', 'quantity', 'unitName', 'sellingPrice',
                  'purchasePrice', 'pos']
        return {
            'header': header,
            'items': [marshall(oi, fields) for oi in order.items]
        }

    @jsonrpc_method(endpoint='rpc', method='order.modify')
    def createOrModify(self, orderId, modifications):
        """ Modify an existing order or create a new one.

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
            "added":[[10018201,{"quantity": 1, "sellingPrice": 1350}]]}]}
        """
        if isinstance(orderId, str):
            new_order = True
            self.order = order = Order(creatorId=self.request.user.partyId)
            self.sess.add(order)
        else:
            new_order = False
            self.loadOrder(orderId)
            order = self.order

        def findItemById(o, oiid):
            for i in o.items:
                if i.orderItemId == oiid:
                    return i
            return None

        m_fields = modifications['header']

        # change of order status needs special handling
        if 'orderStatus' in m_fields:
            old, new = order.orderStatus, m_fields.pop('orderStatus')
            changeOrderStatus(order, old, new)

        for (k, v) in m_fields.items():
            if new_order and not v:
                continue
            setattr(order, k, Decimal(str(v)) if isinstance(v, float) else v)

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
                oi.purchasePrice = Decimal(str(i[1]['purchasePrice']))
                oi.itemName = i[1]['itemName'].strip()
                oi.specification = i[1]['specification'].strip() or None
                oi.model = i[1]['model'].strip() or None
                oi.pos = i[1]['pos']

        # currently only staff can add items to order
        for i in modifications.get('added', []):
            item = self.sess.query(Item).get(i[0])
            order.addItem(itemId=item.itemId,
                          itemName=i[1]['itemName'].strip(),
                          specification=i[1]['specification'].strip() or None,
                          model=i[1]['model'].strip() or None,
                          quantity=Decimal(str(i[1]['quantity'])),
                          unitId=item.unitId,
                          sellingPrice=Decimal(str(i[1]['sellingPrice'])),
                          purchasePrice=Decimal(str(i[1]['purchasePrice'])),
                          pos=i[1]['pos'])

        order.updateTotals()

        if new_order:
            self.sess.flush()
        else:
            # if customer of an order is changed via ecop, release the
            # related coupon
            if 'customerId' in m_fields:
                self._releaseCoupon()
                m_fields.pop('couponUid', None)
            # only a staff can modify an order's couponUid via ecop
            elif 'couponUid' in m_fields:
                cuid = m_fields['couponUid']
                if cuid:
                    self._useCoupon(cuid)
                else:
                    self._releaseCoupon()
            # whenever a bid order is modified by the user, release coupon
            # usage since the condition to use the order might no longer be
            # applicable
            else:
                self._releaseCoupon()
        return order.orderId

    def _releaseCoupon(self):
        """ If a coupon was used for an order during payment and the order is
        still not paid, release the coupon so that it can be used for payment
        for other orders """
        order = self.order

        if order.orderStatus == ORDER_STATUS.BID:
            self.sess.execute(
                PartyCoupon.__table__.update().
                where(PartyCoupon.orderId == order.orderId).
                values(order_id=None))
            order.couponAmount = 0
            order.couponUid = None

    def _useCoupon(self, cuid):
        """ Use the given coupon on the order """
        order = self.order
        orderId = order.orderId

        coupon = self.sess.query(PartyCoupon).get(cuid)
        if coupon.orderId:
            if coupon.orderId != orderId:
                raise RPCUserError('所选优惠券已被使用，请重新选择')
            if order.amount < coupon.coupon.minOrderAmount:
                raise RPCUserError('当前订单金额不到优惠券起用金额，请重新选择')
        else:  # a different and unused coupon
            # prevent one order from locking up 2 coupons from 2 different
            # clients
            self.sess.execute(
                PartyCoupon.__table__.update().where(
                    and_(PartyCoupon.orderId == orderId,
                         PartyCoupon.uid != coupon.uid)
                ).values(order_id=None)
            )

            coupon.orderId = orderId
            order.couponAmount = coupon.coupon.amount
            order.couponUid = coupon.uid

    @jsonrpc_method(endpoint='rpc', method='order.ship')
    def shipOrder(self, orderId, shipperId, docId, shippingDate=None):
        self.loadOrder(orderId)
        order = self.order

        assert order.orderStauts == ORDER_STATUS.PAID, \
            'Can only ship paid order'

        order.shipperId = shipperId
        order.docId = docId
        order.orderStatus = ORDER_STATUS.COMPLETED
        order.shippingDate = shippingDate or date.today()

    @jsonrpc_method(endpoint='rpc', method='order.search')
    def searchOrder(self, cond):
        """ By default the search returns orders that are not closed, except
        when orderStatus is explicitly set.

        The `cond` parameter is a dictionary containing the following keys:
            dateType   # 1 = creationDate, 2 = completionDate
            startDate
            endDate
            orderStatus
            customerId
        """
        start_date = datetime.strptime(cond['startDate'], '%Y-%m-%d')
        end_date = datetime.strptime(cond['endDate'], '%Y-%m-%d')

        if start_date > end_date:
            raise RPCUserError('结束日期必须大于起始日期！')

        query = self.sess.query(Order).join(Order.customer).\
            options(eagerload('customer.referrer'), eagerload('creator'))

        if cond.get('dateType', 1) == 1:
            dateField = Order.createTime
        else:
            dateField = Order.completionDate

        query = query.filter(and_(dateField >= start_date,
                                  dateField < end_date + timedelta(1)))

        if cond['orderStatus']:
            query = query.filter(Order.orderStatus == cond['orderStatus'])
        else:
            query = query.filter(Order.orderStatus != ORDER_STATUS.CLOSED)

        if cond['customerId']:
            query = query.filter(Order.customerId == cond['customerId'])

        fields = [
            'orderId', 'createTime', 'completionDate', 'amount', 'freight',
            'orderStatus', 'cost', 'freightCost', 'couponAmount',
            'customerName', 'creatorName', 'recipientName'
        ]

        return [marshall(o, fields) for o in query.all()]

    @jsonrpc_method(endpoint='rpc', method='coupon.data')
    def getCouponData(self, couponUid):
        coupon = self.sess.query(PartyCoupon).get(couponUid)

        return [{
            'uid': c.uid,
            'couponName': c.coupon.couponName,
            'amount': c.coupon.amount,
            'minOrderAmount': c.coupon.minOrderAmount,
            'startDate': c.startDate or c.coupon.startDate,
            'endDate': c.endDate or c.coupon.endDate
        } for c in (coupon,)]

    @jsonrpc_method(endpoint='rpc', method='order.coupon.get')
    def getCouponForOrder(self, orderId):
        """ Return all coupons that can be used for the order """
        order = self.loadOrder(orderId)

        query = self.sess.query(PartyCoupon).join(Coupon).filter(
            PartyCoupon.partyId == order.customerId,
            PartyCoupon.redemptionTime == None,
            text("now() between party_coupon.start_date "
                 "and party_coupon.end_date + interval '1 day' "),
            or_(PartyCoupon.orderId == None,
                PartyCoupon.orderId == orderId),
            order.amount >= Coupon.minOrderAmount
        ).order_by(PartyCoupon.uid)

        coupons = query.all()

        # if a coupon was used for the order, check if the coupon is still
        # valid. If not, release it.
        if order.couponUid and order.couponUid not in (c.uid for c in coupons):
            self._releaseCoupon()

        return [{
            'uid': c.uid,
            'couponName': c.coupon.couponName,
            'amount': c.coupon.amount,
            'minOrderAmount': c.coupon.minOrderAmount,
            'startDate': c.startDate or c.coupon.startDate,
            'endDate': c.endDate or c.coupon.endDate
        } for c in coupons]

    @jsonrpc_method(endpoint='rpc', method='order.price.get')
    def getItemPrice(self, itemIds, priceType):
        """ Given a list of item ids, return the C-price or B-price based on
        parameter priceType. The return values is a dictionary mapping item id
        to requested price """
        itemIds = set(itemIds)
        items = self.sess.query(Item).filter(Item.itemId.in_(itemIds))
        return dict([
            (i.itemId, i.sellingPriceB if priceType == 'B'else i.sellingPrice)
            for i in items
        ])

    @jsonrpc_method(endpoint='rpc', method='order.pay')
    def payOrder(self, orderId, method=None, amount=None):
        """ Offline payment initialized by staff """
        order = self.loadOrder(orderId)

        assert order.orderStatus == ORDER_STATUS.BID

        now = datetime.now()

        if method and amount:
            assert amount <= order.amount - order.couponAmount
            order.paidAmount = amount

            payment = Payment()
            payment.amount = amount
            payment.payTime = now
            payment.partyId = order.customerId
            payment.paymentMethod = method
            payment.receivedBy = self.request.user.partyId
            self.sess.add(payment)

            self.sess.flush()

            op = OrderPayment()
            op.orderId = order.orderId
            op.paymentId = payment.paymentId
            op.amount = amount
            self.sess.add(op)

        # mark coupon in use as redempted
        if order.couponUid:
            order.coupon.redemptionTime = now

        order.orderStatus = ORDER_STATUS.PAID
        order.confirmTime = now


@view_config(route_name='order_download')
class OrderExportView(DocBase):
    def __init__(self, context, request):
        super(OrderExportView, self).__init__(context, request)

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
    def siteUrl(self):
        """ The url that points to the desktop version of web """
        return siteConfig.canonical_url

    def __call__(self):
        loader = TemplateLoader([os.path.dirname(__file__)])
        tmpl = loader.load('sales_order.rml')
        stream = tmpl.generate(order=self.order, view=self)
        body = rml2pdf.parseString(stream.render()).read()

        response = Response(
            content_type='application/pdf',
            content_length=len(body),
            body=body)
        return response
