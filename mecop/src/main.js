/*global wx, Ecop */

import React from 'react'
import ReactDOM from 'react-dom'
import {HashRouter as Router, Route} from 'react-router-dom'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

// Needed for onTouchTap
// see http://stackoverflow.com/a/34015469/988941
import injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()

import numberLocalizer from 'react-widgets/lib/localizers/simple-number'
numberLocalizer()

import defaultTheme from 'js-common/mui-theme'
import jsonrpc from 'js-common/jsonrpc'

import './app.scss'
import ShipmentPanel from 'view/shipment'


// configure the JSSDK if weixin
if (Ecop.isWeixin) {
  jsonrpc({
      method: 'wechat.jssdk.config',
      params: [location.href],
      success: function (ret) {
          ret.jsApiList = ['scanQRCode']
          wx.config(ret)
      }
  })
}


ReactDOM.render(
  <MuiThemeProvider muiTheme={defaultTheme}>
    <Router>
      <Route path="/" component={ShipmentPanel} />
    </Router>
  </MuiThemeProvider>,

  document.getElementById('root')
)
