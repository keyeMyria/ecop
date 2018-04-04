/* global App */
import React, { Component, Fragment } from 'react'

import { withStyles } from 'material-ui/styles'
import { jsonrpc } from 'homemaster-jslib'

import AppFrame from 'components/AppFrame'
import LoginDialog from 'components/LoginDialog'

const styles = theme => ({
  '@global': {
    body: {
      fontFamily: theme.typography.fontFamily
    }
  }
})

class AppMain extends Component {
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
    App.csrfToken = ret.csrfToken
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

export default withStyles(styles)(AppMain)
