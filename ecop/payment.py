import time

from pyramid_rpc.jsonrpc import jsonrpc_method

from weblibs.wepay import client as wc

from ecop.base import RpcBase


class OrderPaymentJSON(RpcBase):

    @jsonrpc_method(endpoint='rpc', method='order.purchase.pay')
    def payPurchaseOrder(self):
        params = {
            'partner_trade_no': 'P10013061T%d' % time.time(),
            'openid': 'oTc8ftw68ZySfocYl8KbCQHvCcyk',
            'check_name': 'NO_CHECK',
            'amount': '100',
            'desc': '微信付款测试',
            'spbill_create_ip': '58.246.71.78'
        }
        ret = wc.makeRequest('mmpaymkttransfers.promotion.transfers',
            params, cert=True)
        print(ret)
