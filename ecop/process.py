from pyramid_rpc.jsonrpc import jsonrpc_method

from weblibs.jsonrpc import RPCUserError

from ecop.base import RpcBase


class PorcessJSON(RpcBase):
    @jsonrpc_method(endpoint='rpc', method='bpmn.process.start')
    def payPurchaseOrder(self, orderId):
        pass
