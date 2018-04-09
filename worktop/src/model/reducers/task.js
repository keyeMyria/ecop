import update from 'immutability-helper'

import { USER_TASKS_RECEIVED } from '../actions/task'

const initialState = {
  /**
   * A list of task items for the current user
   */
  userTasks: []
}

export default function(state = initialState, action) {
  switch (action.type) {
    case USER_TASKS_RECEIVED:
      return update(state, { userTasks: { $set: action.tasks } })

    default:
      return state
  }
}
