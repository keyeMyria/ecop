import { jsonrpc } from 'homemaster-jslib'

export const PROCESS_RECEIVED = 'PROCESS_RECEIVED'

export const searchProcess = searchText => dispatch => {
  jsonrpc({
    method: 'bpmn.process.list',
    params: [searchText]
  }).then(processes => {
    dispatch({ type: PROCESS_RECEIVED, processes })
  })
}
