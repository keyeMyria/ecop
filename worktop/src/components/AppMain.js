/* global App */
import React, { Component } from 'react'

import { withStyles } from '@material-ui/core/styles'
import { jsonrpc } from 'homemaster-jslib'

import AppFrame from 'components/AppFrame'
import ShipFrame from 'components/ShipFrame'
import LoginDialog from 'components/LoginDialog'

const styles = theme => ({
  '@global': {
    /**
     * TODO: Before MUI fix IE text input adornment problem, we will use this
     * temp fix
     */
    'input[type=text]::-ms-clear': { display: 'none' },
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
    if (!this.state.loggedIn) {
      return <LoginDialog onLoginSuccess={this.onLoginSuccess} />
    } else if (window.location.pathname === '/ikea/shipOrder') {
      return <ShipFrame />
    } else {
      return <AppFrame />
    }
  }
}

export default withStyles(styles)(AppMain)