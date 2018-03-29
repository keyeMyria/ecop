import React, { Component } from 'react'

import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import Paper from 'material-ui/Paper'

import { jsonrpc, message } from 'homemaster-jslib'
import PaperPlaneIcon from 'homemaster-jslib/svg-icons/PaperPlane'

const styles = {
  root: {
    maxWidth: 700,
    padding: 16
  },
  orderId: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  submitButton: {
    marginTop: 12,
    width: '50%'
  },
  buttonRow: {
    textAlign: 'center'
  },
  buttonIcon: {
    marginRight: 10
  }
}

class ShipmentForm extends Component {
  state = { orderIds: '', errorMessage: '' }

  handleSubmit = () => {
    const value = this.state.orderIds
    const lines = value.split('\n')

    // any non-empty line must be 8 or 9 characters
    for (let i = 0; i < lines.length; i++) {
      let l = lines[i].length
      if (l && l < 8) {
        this.setState({ errorMessage: '订单号长度错误' })
        return
      }
    }

    this.setState({ errorMessage: '' })
    console.log('Submittig form ')
  }

  handleChange = e => {
    const { value } = e.target
    const char = value.charAt(value.length - 1)

    // only number and enter
    if (char && char !== '\n' && (char < '0' || char > '9')) return

    const lines = value.split('\n')
    // Do not allow any line to exceed 9 characters
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 9) return
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

    this.setState({ orderIds: value.replace('\n\n', '\n') })
  }

  render = () => {
    const { classes } = this.props

    return (
      <Paper className={classes.root}>
        <TextField
          required
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true
          }}
          label="发货订单号"
          autoFocus
          rows={20}
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
    )
  }
}

export default withStyles(styles)(ShipmentForm)
