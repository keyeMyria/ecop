import React, { Component } from 'react'

import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import Paper from 'material-ui/Paper'

import { jsonrpc, message } from 'homemaster-jslib'
import PaperPlaneIcon from 'homemaster-jslib/svg-icons/PaperPlane'

import ShipmentList from './ShipmentList'

const styles = theme => ({
  orderTable: {
    marginBottom: 16
  },
  inputForm: {
    maxWidth: 700,
    padding: 16
  },
  orderId: theme.custom.orderId,
  submitButton: theme.custom.submitButton,
  buttonRow: theme.custom.buttonRow,
  buttonIcon: theme.custom.buttonIcon
})

class ShipmentForm extends Component {
  state = {
    orderIds: '',
    errorMessage: ''
  }

  handleSubmit = () => {
    const value = this.state.orderIds.trim()
    const lines = value.split('\n')
    let lastline = null

    if (!value) {
      this.setState({ errorMessage: '订单号必须输入' })
      return
    }

    lines.sort()
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]

      // check for duplicate lines
      if (line === lastline) {
        this.setState({ errorMessage: `订单号${line}重复` })
        return
      }
      lastline = line

      // any non-empty line must be 8 or 9 characters
      if (line.length > 0 && line.length < 8) {
        this.setState({ errorMessage: '订单号长度错误' })
        return
      }
    }

    this.setState({ errorMessage: '' })
    jsonrpc({
      method: 'bpmn.worktop.ship',
      params: [lines]
    }).then(ret => {
      message.success('发货成功')
      this.setState({ orderIds: '' })
      this.refreshOutstandingOrders()
    })
  }

  handleChange = e => {
    const { value } = e.target
    const char = value.charAt(value.length - 1)

    // only number and enter
    if (char && char !== '\n' && (char < '0' || char > '9')) return

    const lines = value.split('\n')

    // Do not allow any line to exceed 9 characters and disallow non numbers
    for (let i = 0; i < lines.length; i++) {
      if (!/^\d{0,9}$/.test(lines[i])) return
    }

    /**
     * When enter is pressed at the end, check that any **previous** line must
     * be at least 8 long
     */
    if (char === '\n') {
      for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].length < 8) return
      }
    }

    this.setState({ orderIds: value.replace('\n\n', '\n'), errorMessage: '' })
  }

  render = () => {
    const { classes } = this.props

    return (
      <div>
        <ShipmentList />

        <Paper className={classes.inputForm}>
          <TextField
            required
            fullWidth
            margin="normal"
            InputLabelProps={{
              shrink: true
            }}
            label="发货订单号"
            autoFocus
            rows={10}
            multiline
            value={this.state.orderIds}
            InputProps={{ classes: { input: classes.orderId } }}
            onChange={this.handleChange}
            error={!!this.state.errorMessage}
            helperText={this.state.errorMessage}
          />

          <div className={classes.buttonRow}>
            <Button
              variant="raised"
              color="primary"
              className={classes.submitButton}
              onClick={this.handleSubmit}
            >
              <PaperPlaneIcon className={classes.buttonIcon} />确认发货
            </Button>
          </div>
        </Paper>
      </div>
    )
  }
}

export default withStyles(styles)(ShipmentForm)
