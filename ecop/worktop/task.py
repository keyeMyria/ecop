from dateutil import tz, parser

from pyramid_rpc.jsonrpc import jsonrpc_method
from hm.lib.camunda import CamundaRESTError

from webmodel.order import SalesOrder, PurchaseOrder
from webmodel.consts import ORDER_STATUS
from weblibs.camunda import camundaClient as cc
from weblibs.jsonrpc import RPCUserError, parseDate

from ecop.base import RpcBase
from ecop.region import getRegionName


class TaskJSON(RpcBase):
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
                'sortBy': 'name',
                'sortOrder': 'asc'
            }, {
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
            task = cc.makeRequest(f'/task/{taskId}', 'get',
                withProcessVariables='*')
            task['comments'] = cc.makeRequest(f'/task/{taskId}/comment', 'get')
        except CamundaRESTError as e:
            if e.status == 404:
                task = None
            else:
                raise
        return task

    @jsonrpc_method(endpoint='rpc', method='bpmn.task.complete')
    def completeTask(self, taskId, taskKey, variables=None):
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

        handler = getattr(self, 'handle' + taskKey, None)
        if handler:
            handler(taskId, variables)

        try:
            cc.makeRequest(f'/task/{taskId}/complete',
                           'post', variables=variables)
        except CamundaRESTError as e:
            if e.status == 500:
                return False
            else:
                raise RPCUserError('无法完成该任务，请联系技术支持')
        return True

    def handleCompleteERPOrder(self, taskId, variables):  # pylint: disable=W0613
        orderId = variables['orderId']
        so = self.sess.query(SalesOrder).get(orderId)

        if not so:
            raise RPCUserError(f'未找到ERP订单{orderId}')

        if so.orderStatus != ORDER_STATUS.COMPLETED:
            raise RPCUserError(f'销售订单{orderId}未完成')

        query = self.sess.query(PurchaseOrder).\
            filter_by(relatedOrderId=orderId)
        orders = query.all()

        if not orders or \
                [o for o in orders if o.orderStatus != ORDER_STATUS.COMPLETED]:
            raise RPCUserError(f'未找到该订单对应的采购订单或采购订单未完成')

    @jsonrpc_method(endpoint='rpc', method='bpmn.task.changeDue')
    def changeTaskDueDate(self, taskId, dueDate, justification):
        """
        :param dueDate:
            a javascript object string, normally in the local time zone
        """

        # to change the task due, we have to get the full task object and
        # modify the due, since the PUT method replace the task object as a
        # whole, not just one field
        task = cc.makeRequest(f'/task/{taskId}', 'get')
        newDue = parser.parse(dueDate).replace(hour=23, minute=59, second=59)
        task['due'] = newDue.strftime('%Y-%m-%dT%H:%M:%S.0+0800')
        cc.makeRequest(f'/task/{taskId}', 'put', task)

        message = '\n'.join((
            '任务到期时间从{old}修改为{new}'.format(
                old=parser.parse(task['due']).astimezone(
                    tz.tzlocal()).isoformat()[:19],
                new=newDue.isoformat()[:19]),
            justification
        ))
        cc.makeRequest(f'/task/{taskId}/comment/create', 'post', {
            'message': message
        })
