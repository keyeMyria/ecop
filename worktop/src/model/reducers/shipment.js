import update from 'immutability-helper'

import { OUTSTANDING_SHIPMENT_ORDERS_RECEIVED } from '../actions/shipment'

const initialState = {
  /**
   * A list of orders not yet shipped
   */
  outstandingOrders: []
}

export default function(state = initialState, action) {
  switch (action.type) {
    case OUTSTANDING_SHIPMENT_ORDERS_RECEIVED:
      return update(state, { outstandingOrders: { $set: action.orders } })

    default:
      return state
  }
}
