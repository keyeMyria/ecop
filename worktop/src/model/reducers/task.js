import update from 'immutability-helper'

import {
  USER_TASKS_RECEIVED,
  PROCESS_VARIABLES_RECEIVED
} from '../actions/task'

const initialState = {
  /**
   * A list of task items for the current user
   */
  userTasks: [],
  /**
   * The process variables for the current task
   */
  processVariables: {}
}

export default function(state = initialState, action) {
  switch (action.type) {
    case USER_TASKS_RECEIVED:
      return update(state, { userTasks: { $set: action.tasks } })

    case PROCESS_VARIABLES_RECEIVED:
      return update(state, { processVariables: { $set: action.variables } })

    default:
      return state
  }
}
