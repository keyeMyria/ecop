import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import taskReducer from './reducers/task'
import processReducer from './reducers/process'

const rootReducer = combineReducers({
  task: taskReducer,
  process: processReducer
})

const store = createStore(rootReducer, applyMiddleware(thunk))

export default store
