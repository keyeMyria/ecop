/* global App */
import { jsonrpc } from 'homemaster-jslib'

export const USER_TASKS_RECEIVED = 'USER_TASKS_RECEIVED'
export const PROCESS_VARIABLES_RECEIVED = 'PROCESS_VARIABLES_RECEIVED'

export const userTasksReceived = tasks => dispatch => {
  dispatch({ type: USER_TASKS_RECEIVED, tasks })
}

export const processVariablesReceived = variables => dispatch => {
  dispatch({ type: PROCESS_VARIABLES_RECEIVED, variables })
}

export const fetchUserTasks = () => dispatch => {
  jsonrpc({
    method: 'bpmn.task.getList',
    params: [App.processKey]
  }).then(tasks => {
    dispatch(userTasksReceived(tasks))
  })
}

export const fetchProcessVariables = processId => dispatch => {
  jsonrpc({
    method: 'bpmn.variable.get',
    params: [processId]
  }).then(variables => {
    dispatch(processVariablesReceived(variables))
  })
}
