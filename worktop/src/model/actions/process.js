import { jsonrpc } from 'homemaster-jslib'

export const PROCESS_RECEIVED = 'PROCESS_RECEIVED'

export const searchProcess = cond => dispatch => {
  jsonrpc({
    method: 'bpmn.process.list',
    params: [cond]
  }).then(processes => {
    dispatch({ type: PROCESS_RECEIVED, processes })
  })
}
