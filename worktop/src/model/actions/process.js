/* global App */
import { jsonrpc } from 'homemaster-jslib'

export const PROCESS_RECEIVED = 'PROCESS_RECEIVED'

export const searchProcess = cond => dispatch => {
  jsonrpc({
    method: 'bpmn.process.list',
    params: [
      App.processKey,
      {
        cond,
        sorting: [
          {
            sortBy: 'startTime',
            sortOrder: 'desc'
          }
        ]
      }
    ]
  }).then(processes => {
    dispatch({ type: PROCESS_RECEIVED, processes })
  })
}
