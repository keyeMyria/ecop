/* global App */
import { jsonrpc } from 'homemaster-jslib'

export const USER_TASKS_RECEIVED = 'USER_TASKS_RECEIVED'

export const fetchUserTasks = () => dispatch => {
  jsonrpc({
    method: 'bpmn.task.list',
    params: [App.processKey]
  }).then(tasks => {
    dispatch({ type: USER_TASKS_RECEIVED, tasks })
  })
}
