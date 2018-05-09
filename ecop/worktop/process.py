from pyramid_rpc.jsonrpc import jsonrpc_method

from weblibs.camunda import camundaClient as cc
from weblibs.jsonrpc import RPCUserError, parseDate
from webmodel.consts import ORDER_SOURCE, SPECIAL_PARTY
from webmodel.order import SalesOrder, PurchaseOrder
from webmodel.item import Item
from webmodel.validator import isOrderId, isMobile

from ecop.base import RpcBase
from ecop.worktop.validator import isIkeaOrderId

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
    def getProcessList(self, cond):
        """
        Search process history with the given conditions.

        :param kwargs: a dictionary with possible keywords: orderId,
            customerMobile, customerName. Note those 3 are mutally exclusive.
            There is no sense in supplying all 3.

        """

        params = {
            'processDefinitionKey': 'worktop',
            'sorting': [{
                'sortBy': 'startTime',
                'sortOrder': 'desc'
            }]
        }

        searchText = cond and cond.get('searchText') or None

        if searchText:
            if isOrderId(searchText):
                params['processInstanceBusinessKey'] = searchText
            elif isIkeaOrderId(searchText):
                params['variables'] = [{
                    'name': 'externalOrderId',
                    'operator': 'eq',
                    'value': searchText.upper()
                }]
            elif isMobile(searchText):
                params['variables'] = [{
                    'name': 'customerMobile',
                    'operator': 'eq',
                    'value': searchText
                }]
            else:
                params['variables'] = [{
                    'name': 'customerName',
                    'operator': 'eq',
                    'value': searchText
                }]

        storeId = self.request.user.extraData['worktop'].get('storeId')
        if storeId:
            variables = params.setdefault('variables', [])
            variables.append({
                'name': 'storeId',
                'operator': 'eq',
                'value': storeId
            })

        ret = cc.makeRequest(
            '/history/process-instance', 'post',
            params,
            urlParams={'maxResults': 50},
            withProcessVariables=(
                'externalOrderId', 'customerName', 'storeId', 'receivingDate',
                'actualMeasurementDate', 'confirmedMeasurementDate',
                'scheduledMeasurementDate', 'actualInstallationDate',
                'confirmedInstallationDate', 'scheduledInstallationDate'
            ),
            processInstanceIdField='id', hoistProcessVariables=True
        )

        return ret

    @jsonrpc_method(endpoint='rpc', method='bpmn.variable.get')
    def getProcessVariables(self, processInstanceId):
        ret = cc.makeRequest(f'/history/variable-instance', 'post', {
            'processInstanceIdIn': [processInstanceId]
        }, urlParams={'deserializeValues': 'false'})
        return cc.parseVariables(ret)
