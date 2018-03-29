import logging

from pyramid_rpc.jsonrpc import jsonrpc_method
from hm.lib.camunda import CamundaRESTError

from weblibs.camunda import camundaClient as cc
from weblibs.jsonrpc import RPCUserError, parseDate
from webmodel.consts import ORDER_SOURCE, SPECIAL_PARTY
from webmodel.order import SalesOrder

from ecop.base import RpcBase

logger = logging.getLogger(__name__)


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

    @jsonrpc_method(endpoint='rpc', method='bpmn.worktop.ship')
    def shipWorktop(self, extOrderIds):
        """
        Send the WorktopShipped signal to all waiting processes given by the
        orderId list.

        :param orderIds:
            A list of externalOrderId
        :returns:
            An error message if any
        """
        errors = []
        for externalOrderId in extOrderIds:
            ret = cc.makeRequest('/execution', 'post', params={
                'signalEventSubscriptionName': 'WorktopShipped',
                'processDefinitionKey': 'worktop',
                'processVariables': [{
                    'name': 'externalOrderId',
                    'operator': 'eq',
                    'value': externalOrderId
                }]
            })

            if not ret:
                errors.append(f'未找到待发货的订单{externalOrderId}')
                continue

            if len(ret) != 1:
                logger.error(
                    f'Multiple executions found for externalOrderId '
                    '{externalOrderId}')
                errors.append(f'订单{externalOrderId}发货错误')
                continue

            try:
                cc.makeRequest('/signal', 'post', params={
                    'name': 'WorktopShipped',
                    'executionId': ret[0]['id']
                })
            except CamundaRESTError:
                errors.append(f'订单{externalOrderId}发货错误')

        return '\n'.join(errors) if errors else None
