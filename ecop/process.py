from datetime import datetime
from pyramid_rpc.jsonrpc import jsonrpc_method

from weblibs.camunda import camundaClient as cc
from weblibs.jsonrpc import RPCUserError

from webmodel.consts import ORDER_SOURCE
from webmodel.order import SalesOrder

from ecop.base import RpcBase


class PorcessJSON(RpcBase):
    @jsonrpc_method(endpoint='rpc', method='bpmn.process.start')
    def startProcess(self, params):
        externalOrderId = params['orderId']
        if self.sess.query(SalesOrder).filter_by(
            orderSource=ORDER_SOURCE.IKEA,
            externalOrderId=externalOrderId
        ).all():
            raise RPCUserError('该订单号已存在，不能重复提交')

        return

        cc.makeRequest('/process-definition/key/worktop/start', 'post', {
            'businessKey': '124812412',
            'variables': {
                'scheduledMeasureDate': {
                    'value': datetime.now().isoformat(),
                    'type': 'Date'
                }
            }
        })
