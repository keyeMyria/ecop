/* global App */
import React from 'react'
import ReactDOM from 'react-dom'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import CssBaseline from 'material-ui/CssBaseline'
import DateFnsUtils from 'material-ui-pickers/utils/date-fns-utils'
import MuiPickersUtilsProvider from 'material-ui-pickers/utils/MuiPickersUtilsProvider'

import { theme, message, jsonrpc } from 'homemaster-jslib'
import AppFrame from 'components/AppFrame'
import LoginDialog from './components/LoginDialog';

// polyfill ie for symbol
require('core-js/fn/symbol')
// polyfill ie for promise
require('core-js/fn/promise')
// polyfill for String.startsWith
require('core-js/fn/string/virtual/starts-with')
// polyfill for Array.findIndex
require('core-js/fn/array/find-index')

Object.assign(jsonrpc, {
  onerror: error => {
    const level = (error.data && error.data.level) || 'error'
    message[level](error.message, { autoHide: 5000 })
  },
  csrfToken: App.csrfToken,
  extraHeader: { 'X-Client-Version': App.version }
})

ReactDOM.render(
  <MuiThemeProvider theme={theme}>
    <CssBaseline />
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <AppFrame />
    </MuiPickersUtilsProvider>
  </MuiThemeProvider>,
  document.getElementById('app')
)
