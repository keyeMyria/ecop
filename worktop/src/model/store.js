import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import taskReducer from './reducers/task'

const rootReducer = combineReducers({
  task: taskReducer
})

const store = createStore(rootReducer, applyMiddleware(thunk))

export default store
