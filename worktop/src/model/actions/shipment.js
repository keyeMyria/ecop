import { jsonrpc } from 'homemaster-jslib'

export const OUTSTANDING_SHIPMENT_ORDERS_RECEIVED =
  'OUTSTANDING_SHIPMENT_ORDERS_RECEIVED'

export const fetchOutstandingOrders = () => dispatch => {
  jsonrpc({
    method: 'bpmn.shipment.getOutstandingOrders',
  }).then(orders => {
    dispatch({ type: OUTSTANDING_SHIPMENT_ORDERS_RECEIVED, orders })
  })
}
