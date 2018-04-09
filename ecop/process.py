import logging

from pyramid_rpc.jsonrpc import jsonrpc_method
from hm.lib.camunda import CamundaRESTError

from weblibs.camunda import camundaClient as cc
from weblibs.jsonrpc import RPCUserError, parseDate
from webmodel.consts import ORDER_SOURCE, SPECIAL_PARTY
from webmodel.order import SalesOrder

from ecop.base import RpcBase
from ecop.region import getRegionName

logger = logging.getLogger(__name__)

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


class PorcessJSON(RpcBase):
    @jsonrpc_method(endpoint='rpc', method='bpmn.process.start')
    def startProcess(self, processKey, params):
        params = parseDate(
            params,
            fields=['scheduledMeasurementDate', 'scheduledInstallationDate']
        )

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

        if externalOrderId:
            order.externalOrderId = externalOrderId
        else:
            params['externalOrderId'] = str(order.orderId)

        cc.makeRequest(
            f'/process-definition/key/{processKey}/start', 'post',
            {'businessKey': order.orderId},
            variables=params
        )

    @jsonrpc_method(endpoint='rpc', method='bpmn.task.list')
    def getTaskList(self, processKey):
        """
        Return all active tasks of a process key. In additional to the
        properties of the Camunda task object, we also return serveral
        additional process variables related to the task, like externalOrderId
        and customerName in a `processVariables` attribute.
        """
        params = {
            'processDefinitionKey': processKey,
            'sorting': [{
                'sortBy': 'dueDate',
                'sortOrder': 'asc'
            }]
        }
        userGroup = self.request.user.extraData[processKey].get('group')
        if userGroup:
            params['candidateGroup'] = userGroup
        tasks = cc.makeRequest(
            '/task', 'post', params,
            withProcessVariables=('externalOrderId', 'customerName',
                                  'customerRegionCode'))
        for t in tasks:
            var = t['processVariables']
            var['customerRegionName'] = getRegionName(
                var['customerRegionCode'])

        return tasks

    @jsonrpc_method(endpoint='rpc', method='bpmn.task.get')
    def getTask(self, taskId):
        """
        Return a single task by task id. Used to check if a task is still
        active. If the task can no longer be found, maybe completed by someone
        else, return None
        """
        try:
            task = cc.makeRequest(
                f'/task/{taskId}', 'get', withProcessVariables='*')
        except CamundaRESTError as e:
            if e.status == 404:
                task = None
            else:
                raise
        return task

    @jsonrpc_method(endpoint='rpc', method='bpmn.task.complete')
    def completeTask(self, taskId, variables=None):
        """ Complete the given task and change the process variables.

        :return:
            True if task completes successfully.
            False if status 500 is returned by camunda, usually because the
                task is already completed by some other user

        :raises:
            RPCUserError when anything else happens
        """
        # parse all variable fields whose name ends with Date as date
        # we'd better check against a process variable repository to find
        # the type in stead of relying on variable naming
        if variables:
            variables = parseDate(
                variables,
                fields=[
                    fname for fname in variables if fname.endswith('Date')]
            )

        try:
            cc.makeRequest(f'/task/{taskId}/complete',
                           'post', variables=variables)
        except CamundaRESTError as e:
            if e.status == 500:
                return False
            else:
                raise RPCUserError('无法完成该任务，请联系技术支持')
        return True

    @jsonrpc_method(endpoint='rpc', method='bpmn.process.list')
    def getProcessList(self, processKey, params):
        params['processDefinitionKey'] = processKey
        ret = cc.makeRequest(
            '/history/process-instance', 'post',
            params, urlParams={'maxResults': 50},
            withProcessVariables=(
                'externalOrderId', 'customerName', 'storeId',
                'customerRegionCode', 'confirmedMeasurementDate',
                'confirmedInstallationDate'),
            processInstanceIdField='id', hoistProcessVariables=True
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
        executionIds = []
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
            })

            if not ret:
                errors.append(f'未找到待发货的订单{externalOrderId}')
            elif len(ret) != 1:
                errors.append(f'订单{externalOrderId}无法发货发货')
            else:
                executionIds.append(ret[0]['id'])

        if errors:
            raise RPCUserError('\n'.join(errors))

        for (idx, exid) in enumerate(executionIds):
            try:
                cc.makeRequest('/signal', 'post', params={
                    'name': 'WorktopShipped',
                    'executionId': exid})
            except CamundaRESTError:
                errors.append(f'订单{extOrderIds[idx]}发货错误')

        if errors:
            raise RPCUserError('\n'.join(errors))
