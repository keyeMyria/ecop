/* global App */
import { jsonrpc } from 'homemaster-jslib'

export const FETCH_USER_TASKS = 'FETCH_USER_TASKS'
export const USER_TASKS_RECEIVED = 'USER_TASKS_RECEIVED'

export const userTasksReceived = tasks => dispatch => {
  dispatch({ type: USER_TASKS_RECEIVED, tasks })
}

export const fetchUserTasks = () => dispatch => {
  jsonrpc({
    method: 'bpmn.task.get',
    params: [App.processKey]
  }).then(tasks => {
    dispatch(userTasksReceived(tasks))
  })
}
