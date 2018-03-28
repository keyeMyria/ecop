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
  state = { orderIdList: [] }

  handleSubmit = () => {}

  render = () => {
    const { classes } = this.props
    const { values } = this.state

    return (
      <Paper className={classes.root}>
        <TextField
          required={false}
          autoFocus
          InputProps={{ classes: { input: classes.orderId } }}
          onChange={e => {
            var { value } = e.target
            if (/^\d{0,9}$/.test(value) || !value) {
              this.setState({ values: { ...values, externalOrderId: value } })
            }
          }}
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
