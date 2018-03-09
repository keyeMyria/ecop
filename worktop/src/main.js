/* global App */
import React from 'react'
import ReactDOM from 'react-dom'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import Reboot from 'material-ui/Reboot'

import { theme, message, jsonrpc } from 'homemaster-jslib'

import AppFrame from 'components/AppFrame'

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
    <Reboot />
    <AppFrame />
  </MuiThemeProvider>,
  document.getElementById('app')
)
