/* global App */
import React, { Component, Fragment } from 'react'
import { jsonrpc } from 'homemaster-jslib'

import AppFrame from 'components/AppFrame'
import LoginDialog from 'components/LoginDialog'

export default class AppMain extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loggedIn: !!App.csrfToken
    }
  }

  onLoginSuccess = ret => {
    // be sure to do this before the next step
    Object.assign(jsonrpc, {
      csrfToken: ret.csrfToken
    })
    delete ret.csrfToken
    App.userInfo = ret
    this.setState({ loggedIn: true })
  }

  render() {
    return (
      <Fragment>
        {this.state.loggedIn ? (
          <AppFrame />
        ) : (
          <LoginDialog onLoginSuccess={this.onLoginSuccess} />
        )}
      </Fragment>
    )
  }
}
