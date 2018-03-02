import React from 'react'
import ReactDOM from 'react-dom'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

import jsonrpc from './jsonrpc'
import message from './message'
import theme from './mui-theme'
import LoginDialog from 'auth/login'

import './app.scss'

jsonrpc.onerror = error => {
  const level = (error.data && error.data.level) || 'error'
  message[level](error.message, { autoHide: 5000 })
}

ReactDOM.render(
  <MuiThemeProvider theme={theme}>
    <LoginDialog />
  </MuiThemeProvider>,
  document.getElementById('root')
)
