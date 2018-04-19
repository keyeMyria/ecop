from datetime import date, timedelta

from pyramid_rpc.jsonrpc import jsonrpc_method
from hm.lib.camunda import CamundaRESTError

from weblibs.camunda import camundaClient as cc
from weblibs.jsonrpc import RPCUserError, parseDate
from webmodel.consts import ORDER_SOURCE, SPECIAL_PARTY
from webmodel.order import SalesOrder

from ecop.base import RpcBase
from ecop.region import getRegionName

"""
In case a process instance needs manual correction, use:

POST /process-instance/abe0b544-33f3-11e8-8a21-0242ac110005/modification
{
  "instructions": [{
    "type": "startAfterActivity",
    "activityId": "ConfirmMeasurementDate"
  },{
    "type": "cancel",
    "activityId": "MakeDrawing"
  }]
}
"""


class ProcessJSON(RpcBase):
    @jsonrpc_method(endpoint='rpc', method='bpmn.process.start')
    def startProcess(self, processKey, params):
        params = parseDate(
            params,
            fields=['scheduledMeasurementDate', 'scheduledInstallationDate']
        )

        if not params['scheduledInstallationDate']:
            params.pop('scheduledInstallationDate')

        if not params['isMeasurementRequested']:
            params.pop('scheduledMeasurementDate', None)
            params['productionDrawing'] = params['orderFile']

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
        params['orderId'] = order.orderId

        if externalOrderId:
            order.externalOrderId = externalOrderId
        else:
            params['externalOrderId'] = str(order.orderId)

        cc.makeRequest(
            f'/process-definition/key/{processKey}/start', 'post',
            {'businessKey': order.orderId},
            variables=params
        )


    @jsonrpc_method(endpoint='rpc', method='bpmn.process.list')
    def getProcessList(self, processKey, kwargs):
        params = {
            'processDefinitionKey': processKey,
            'sorting': kwargs['sorting']
        }

        if 'cond' in kwargs:
            orderId = kwargs['cond'].get('orderId')
            if orderId:
                if len(orderId) == 8:
                    params['processInstanceBusinessKey'] = orderId
                else:
                    params['variables'] = [{
                        'name': 'externalOrderId',
                        'operator': 'eq',
                        'value': orderId
                    }]

        ret = cc.makeRequest(
            '/history/process-instance', 'post',
            params, urlParams={'maxResults': 50},
            withProcessVariables=(
                'externalOrderId', 'customerName', 'storeId',
                'customerRegionCode', 'shippingDate', 'receivingDate',
                'actualMeasurementDate',
                'confirmedMeasurementDate',
                'scheduledMeasurementDate',
                'actualInstallationDate',
                'confirmedInstallationDate',
                'scheduledInstallationDate'
            ),
            processInstanceIdField='id', hoistProcessVariables=True
        )

        for t in ret:
            if 'customerRegionCode' in t:
                t['customerRegionName'] = getRegionName(
                    t['customerRegionCode'])
                del t['customerRegionCode']
        return ret

    @jsonrpc_method(endpoint='rpc', method='bpmn.variable.get')
    def getProcessVariables(self, processInstanceId):
        ret = cc.makeRequest(f'/history/variable-instance', 'post', {
            'processInstanceIdIn': [processInstanceId]
        }, urlParams={'deserializeValues': 'false'})
        return cc.parseVariables(ret)

    @jsonrpc_method(endpoint='rpc', method='bpmn.shipment.getOutstandingOrders')
    def getOutstandingOrders(self, processKey):
        params = {
            'processDefinitionKey': processKey,
            'activityId': 'WorktopShipped',
            'unfinished': True
        }

        ret = cc.makeRequest(
            '/history/activity-instance', 'post',
            params, urlParams={'maxResults': 50},
            withProcessVariables=(
                'orderId', 'externalOrderId', 'factoryNumber', 'customerName',
                'customerRegionCode', 'scheduledInstallationDate'),
            hoistProcessVariables=True
        )

        for t in ret:
            if 'customerRegionCode' in t:
                t['customerRegionName'] = getRegionName(
                    t['customerRegionCode'])
                del t['customerRegionCode']
        return ret

    @jsonrpc_method(endpoint='rpc', method='bpmn.worktop.ship')
    def shipWorktop(self, extOrderIds):
        """
        Send the WorktopShipped signal to all waiting processes given by the
        orderId list.

        :param orderIds:
            A list of externalOrderId
        :raises RPCUserError:
            Raises RPCUserError if any order can not be shipped or if any error
            occurs during the signal sending to any order.
        """
        errors = []
        executions = []
        extOrderIds = set(extOrderIds)  # deduplicate

        for externalOrderId in extOrderIds:
            ret = cc.makeRequest('/execution', 'post', params={
                'signalEventSubscriptionName': 'WorktopShipped',
                'processDefinitionKey': 'worktop',
                'processVariables': [{
                    'name': 'externalOrderId',
                    'operator': 'eq',
                    'value': externalOrderId
                }]
            },
                withProcessVariables=(
                'externalOrderId', 'scheduledInstallationDate'),
                hoistProcessVariables=True
            )

            if not ret:
                errors.append(f'未找到待发货的订单{externalOrderId}')
            elif len(ret) != 1:
                errors.append(f'订单{externalOrderId}无法发货发货')
            else:
                executions.append(ret[0])

        if errors:
            raise RPCUserError('\n'.join(errors))

        for exe in executions:
            try:
                # TODO: this is a temporary fix so that process without
                # scheduledInstallationDate can continue past into next step by
                # defaulting the date to 3 days from shipment date
                variables = cc.convertVariables(
                    {'scheduledInstallationDate': date.today()+timedelta(3)})
                cc.makeRequest(
                    f'/process-instance/{exe["processInstanceId"]}'
                    '/variables/scheduledInstallationDate',
                    'put', params=variables['scheduledInstallationDate'])

                cc.makeRequest('/signal', 'post', params={
                    'name': 'WorktopShipped',
                    'executionId': exe['id']})
            except CamundaRESTError:
                errors.append(f"订单{exe['externalOrderId']}发货错误")

        if errors:
            raise RPCUserError('\n'.join(errors))

    @jsonrpc_method(endpoint='rpc', method='bpmn.worktop.receive')
    def receiveWorktop(self, orderId):
        ret = cc.makeRequest('/execution', 'post', params={
            'signalEventSubscriptionName': 'WorktopReceived',
            'processDefinitionKey': 'worktop',
            'businessKey': orderId
        })

        if len(ret) != 1:
            raise RPCUserError('Wrong')

        cc.makeRequest('/signal', 'post', params={
            'name': 'WorktopReceived',
            'executionId': ret[0]['id']
        })
