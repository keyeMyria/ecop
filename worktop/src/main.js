/* global App, wx */
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import MuiPickersUtilsProvider from 'material-ui-pickers/utils/MuiPickersUtilsProvider'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import CssBaseline from 'material-ui/CssBaseline'
import 'typeface-roboto'

import { message, jsonrpc, addJSExceptionLogging } from 'homemaster-jslib'
import DateFnsUtils from 'utils/date-fns-utils'
import AppMain from 'components/AppMain'
import theme from './theme'
import store from './model/store'
import cnLocale from 'date-fns/locale/zh-CN'

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
    switch (error.code) {
      case -200:
        const level = (error.data && error.data.level) || 'error'
        message[level](error.message)
        break
      case -300:
        message.warn('系统已升级，请刷新浏览器', {
          callback: () => {
            window.location.reload()
          }
        })
        break
      default:
        message.error('系统错误，请联系系统维护人员')
    }
  },
  csrfToken: App.csrfToken,
  extraHeader: { 'X-Client-Version': App.version }
})

if (App.isWeixin) {
  jsonrpc({
    method: 'wechat.jssdk.config',
    params: [window.location.href],
    success: function(ret) {
      ret.jsApiList = ['scanQRCode']
      wx.config(ret)
    }
  })
}

addJSExceptionLogging()

ReactDOM.render(
  <Provider store={store}>
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <MuiPickersUtilsProvider utils={DateFnsUtils} locale={cnLocale}>
        <AppMain />
      </MuiPickersUtilsProvider>
    </MuiThemeProvider>
  </Provider>,
  document.getElementById('app')
)
