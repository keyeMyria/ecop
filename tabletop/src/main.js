/* global App */
import React from 'react'
import ReactDOM from 'react-dom'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import Reboot from 'material-ui/Reboot'

import { theme, message, jsonrpc } from 'homemaster-jslib'

import AppFrame from 'components/AppFrame'

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
