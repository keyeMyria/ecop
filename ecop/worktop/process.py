from pyramid_rpc.jsonrpc import jsonrpc_method

from weblibs.camunda import camundaClient as cc
from weblibs.jsonrpc import RPCUserError, parseDate
from webmodel.consts import ORDER_SOURCE, SPECIAL_PARTY
from webmodel.order import SalesOrder, PurchaseOrder
from webmodel.item import Item

from ecop.base import RpcBase
from ecop.region import getRegionName

"""
In case a process instance needs manual correction, use:

POST /process-instance/abe0b544-33f3-11e8-8a21-0242ac110005/modification
{
  "instructions": [{
    "type": "startBeforeActivity",
    "activityId": "ConfirmMeasurementDate"
  },{
    "type": "cancel",
    "activityId": "TakeMeasurement"
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

        if params['isMeasurementRequested']:
            itemMeasure = self.sess.query(Item).get(10023928)
            order.addItem(item=itemMeasure, quantity=1)
        itemInstall = self.sess.query(Item).get(10023929)
        order.addItem(item=itemInstall, quantity=1)

        self.sess.add(order)
        self.sess.flush()

        po = PurchaseOrder(
            supplierId=10025188,
            customerId=int(SPECIAL_PARTY.BE),
            creatorId=self.request.user.partyId,
            regionCode=params['customerRegionCode'],
            streetAddress=params['customerStreet'],
            recipientName=params['customerName'],
            recipientMobile=params['customerMobile'],
            relatedOrderId=order.orderId
        )
        if params['isMeasurementRequested']:
            po.addItem(item=itemMeasure, quantity=1)
        po.addItem(item=itemInstall, quantity=1)
        self.sess.add(po)

        if externalOrderId:
            order.externalOrderId = externalOrderId
        else:
            params['externalOrderId'] = str(order.orderId)

        # add orderId also as a process instance variable
        params['orderId'] = order.orderId

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
            customerMobile = kwargs['cond'].get('customerMobile')

            if orderId:
                if len(orderId) == 8:
                    params['processInstanceBusinessKey'] = orderId
                else:
                    params['variables'] = [{
                        'name': 'externalOrderId',
                        'operator': 'eq',
                        'value': orderId
                    }]
            elif customerMobile:
                params['variables'] = [{
                    'name': 'customerMobile',
                    'operator': 'eq',
                    'value': customerMobile
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
