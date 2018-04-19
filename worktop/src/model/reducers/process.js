import update from 'immutability-helper'

import { PROCESS_RECEIVED } from '../actions/process'

const initialState = {
  /**
   * A list of process
   */
  processList: undefined
}

export default function(state = initialState, action) {
  switch (action.type) {
    case PROCESS_RECEIVED:
      return update(state, { processList: { $set: action.processes } })

    default:
      return state
  }
}
