/* global App */
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import MuiPickersUtilsProvider from 'material-ui-pickers/utils/MuiPickersUtilsProvider'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import CssBaseline from 'material-ui/CssBaseline'
import 'typeface-roboto'

import { message, jsonrpc } from 'homemaster-jslib'
import DateFnsUtils from 'utils/date-fns-utils'
import AppFrame from 'components/AppFrame'
import LoginDialog from 'components/LoginDialog'
import theme from './theme'
import store from './model/store'

// polyfill ie for symbol
require('core-js/fn/symbol')
// polyfill ie for promise
require('core-js/fn/promise')
// polyfill for String.startsWith
require('core-js/fn/string/virtual/starts-with')
// polyfill for Array.findIndex
require('core-js/fn/array/find-index')

App.processKey = 'worktop'

Object.assign(jsonrpc, {
  onerror: error => {
    const level = (error.data && error.data.level) || 'error'
    message[level](error.message, { autoHide: 5000 })
  },
  csrfToken: App.csrfToken,
  extraHeader: { 'X-Client-Version': App.version }
})

ReactDOM.render(
  <Provider store={store}>
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        {App.csrfToken ? <AppFrame /> : <LoginDialog />}
      </MuiPickersUtilsProvider>
    </MuiThemeProvider>
  </Provider>,
  document.getElementById('app')
)
