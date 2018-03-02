/**
 *
 * The module exports a single object that will be lazily rendered a
 * MessageDialog component into the DOM upon first use.
 *
 *   import message from 'js-common/message'
 *   message.error('Something wrong', {autoHide: 2000, callback: fn})
 *
 *  The callback function will be invoked when the message is closed.
 *
 */

import React from 'react'
import { render } from 'react-dom'
import delay from 'lodash/delay'

import Dialog, { DialogContent, DialogActions } from 'material-ui/Dialog'
import Button from 'material-ui/Button'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import InfoIcon from 'material-ui-icons/Info'
import CheckCircleIcon from 'material-ui-icons/CheckCircle'
import WarningIcon from 'material-ui-icons/Warning'
import ErrorIcon from 'material-ui-icons/Error'
import { orange, red, green, grey } from 'material-ui/colors'

import theme from './mui-theme'

const iconStyles = {
  width: 48,
  height: 48
}

class MessageDialog extends React.Component {
  state = {
    open: false,
    method: null,
    message: '',
    callback: null
  }

  handleClose = () => {
    // clear any pending close timer
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.setState({ open: false })
  }

  show = options => {
    this.setState({
      open: true,
      method: options.method,
      message: options.message,
      callback: options.callback
    })

    if (options.autoHide) {
      this.timer = delay(this.handleClose, options.autoHide)
    }
  }

  success = (message, options) => {
    this.show(
      Object.assign(options || {}, {
        message: message,
        method: 'success'
      })
    )
  }

  info = (message, options) => {
    this.show(
      Object.assign(options || {}, {
        message: message,
        method: 'info'
      })
    )
  }

  error = (message, options) => {
    this.show(
      Object.assign(options || {}, {
        message: message,
        method: 'error'
      })
    )
  }

  warn = (message, options) => {
    this.show(
      Object.assign(options || {}, {
        message: message,
        method: 'warn'
      })
    )
  }

  render() {
    const { open, method, message, callback } = this.state

    const MessageIcon = () => {
      switch (method) {
        case 'warn':
          return <WarningIcon style={{ ...iconStyles, color: orange[300] }} />
        case 'info':
          return <InfoIcon style={{ ...iconStyles, color: grey[400] }} />
        case 'error':
          return <ErrorIcon style={{ ...iconStyles, color: red[700] }} />
        case 'success':
          return (
            <CheckCircleIcon style={{ ...iconStyles, color: green[500] }} />
          )
        default:
          return null
      }
    }

    return (
      <MuiThemeProvider theme={theme}>
        <Dialog open={open} onExited={callback}>
          <DialogContent>
            <div style={{ float: 'left' }}>
              <MessageIcon />
            </div>
            <div style={{ marginLeft: '70px' }}>{message}</div>
          </DialogContent>
          <DialogActions>
            <Button color="primary" onClick={this.handleClose}>
              <CheckCircleIcon />确&nbsp;定
            </Button>
          </DialogActions>
        </Dialog>
      </MuiThemeProvider>
    )
  }
}

var dialog = null

function invoke(name, ...args) {
  if (!dialog) {
    const wrapper = document.createElement('div')
    document.body.appendChild(wrapper)
    dialog = render(<MessageDialog />, wrapper)
  }
  dialog[name](...args)
}

export default ['show', 'success', 'info', 'error', 'warn'].reduce(
  (o, name) => {
    o[name] = invoke.bind(null, name)
    return o
  },
  {}
)
