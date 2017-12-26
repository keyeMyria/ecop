import time
from datetime import datetime

from pyramid_rpc.jsonrpc import jsonrpc_method

from webmodel.consts import PAYMENT_GATEWAY
from webmodel.order import PurchaseOrder, ORDER_STATUS
from webmodel.payment import Payment, OrderPayment

from weblibs.wepay import client as wc
from weblibs.jsonrpc import RPCUserError

from ecop.base import RpcBase


class OrderPaymentJSON(RpcBase):
    @jsonrpc_method(endpoint='rpc', method='order.purchase.pay')
    def payPurchaseOrder(self, orderId):
        sess = self.sess
        order = sess.query(PurchaseOrder).get(orderId)

        assert order, RPCUserError('订单号错误')
        assert order.orderStatus == ORDER_STATUS.COMPLETED, \
            RPCUserError('订单未完成，不能付款')

        openId = order.supplier.wechatOpenId
        assert openId, RPCUserError('供应商未关联微信')

        amount = order.payableAmount
        assert amount, RPCUserError('订单没有未付金额')

        params = {
            'partner_trade_no': '%dT%d' % (order.orderId, time.time()),
            'openid': openId,
            'check_name': 'NO_CHECK',
            'amount': int(amount * 100),
            'desc': '大管家订单%d' % order.orderId,
            # this parameter is required but the value is not important
            'spbill_create_ip': '192.168.0.1'
        }
        ret = wc.makeRequest('mmpaymkttransfers.promotion.transfers',
            params, cert=True)

        if ret.result_code == 'FAIL':
            raise RPCUserError(ret.err_code_des)

        payment = Payment(
            amount=amount,
            externalPaymentId=str(ret.payment_no),
            externalUserId=openId,
            payTime=datetime.strptime(
                str(ret.payment_time), '%Y-%m-%d %H:%M:%S'),
            partyId=order.supplierId,
            outTradeNo=str(ret.partner_trade_no),
            creatorId=self.request.user.partyId,
            paymentGateway=PAYMENT_GATEWAY.WEPAY,
            paymentMethod=27
        )
        sess.add(payment)
        sess.flush()

        sess.add(OrderPayment(
            orderId=order.orderId,
            paymentId=payment.paymentId,
            amount=amount
        ))
        order.paidAmount += amount
