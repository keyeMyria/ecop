from pyramid_rpc.jsonrpc import jsonrpc_method

from weblibs.camunda import camundaClient as cc
from weblibs.jsonrpc import RPCUserError, parseDate

from webmodel.consts import ORDER_SOURCE, SPECIAL_PARTY
from webmodel.order import SalesOrder

from ecop.base import RpcBase


class PorcessJSON(RpcBase):
    @jsonrpc_method(endpoint='rpc', method='bpmn.process.start')
    def startProcess(self, processKey, params):
        params = parseDate(
            params,
            fields=['scheduledMeasurementDate', 'scheduledInstallationDate']
        )

        externalOrderId = params.get('externalOrderId')
        if externalOrderId and \
                self.sess.query(SalesOrder).filter_by(
                    orderSource=ORDER_SOURCE.IKEA,
                    externalOrderId=externalOrderId
                ).all():
            raise RPCUserError('该订单号已存在，不能重复提交')

        order = SalesOrder(
            customerId=int(SPECIAL_PARTY.BE),
            creatorId=self.request.user.partyId,
            regionCode=params['customerRegionCode'],
            streetAddress=params['customerStreet'],
            recipientName=params['customerName'],
            recipientMobile=params['customerMobile'],
            orderSource=ORDER_SOURCE.IKEA
        )
        self.sess.add(order)
        self.sess.flush()

        if externalOrderId:
            order.externalOrderId = externalOrderId
        else:
            params['externalOrderId'] = str(order.orderId)

        cc.makeRequest(
            f'/process-definition/key/{processKey}/start', 'post',
            {'businessKey': order.orderId},
            variables=params
        )

    @jsonrpc_method(endpoint='rpc', method='bpmn.task.get')
    def getUserTask(self, processKey):
        return cc.makeRequest('/task', 'post', {
            'processDefinitionKey': processKey
        })

    @jsonrpc_method(endpoint='rpc', method='bpmn.variable.get')
    def getProcessVariables(self, processId):
        ret = cc.makeRequest('/variable-instance', 'post', {
            'processInstanceIdIn': [processId]
        }, urlParams={'deserializeValues': 'false'})
        return cc.parseVariables(ret)

    @jsonrpc_method(endpoint='rpc', method='bpmn.task.complete')
    def completeTask(self, taskId, variables):
        # parse all variable fields whose name ends with Date as date
        # we'd better check against a process variable repository to find
        # the type in stead of relying on variable naming
        variables = parseDate(
            variables,
            fields=[fname for fname in variables if fname.endswith('Date')]
        )
        cc.makeRequest(f'/task/{taskId}/complete', 'post', variables=variables)
