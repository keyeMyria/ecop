import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import taskReducer from './reducers/task'
import processReducer from './reducers/process'
import shipmentReducer from './reducers/shipment'

const rootReducer = combineReducers({
  task: taskReducer,
  process: processReducer,
  shipment: shipmentReducer
})

const store = createStore(rootReducer, applyMiddleware(thunk))

export default store
