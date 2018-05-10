import { jsonrpc } from 'homemaster-jslib'

export const USER_TASKS_RECEIVED = 'USER_TASKS_RECEIVED'

export const fetchUserTasks = () => dispatch => {
  jsonrpc({
    method: 'bpmn.task.list',
  }).then(tasks => {
    dispatch({ type: USER_TASKS_RECEIVED, tasks })
  })
}
