import React, { Component } from 'react'
import { connect } from 'react-redux'
import compose from 'recompose/compose'

import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import Paper from 'material-ui/Paper'

import { jsonrpc, message } from 'homemaster-jslib'
import PaperPlaneIcon from 'homemaster-jslib/svg-icons/PaperPlane'

import ShipmentList from './ShipmentList'
import { fetchOutstandingOrders } from 'model/actions'
import { isValidOrderId } from 'utils/validators'

const styles = theme => ({
  orderList: {
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

  componentDidMount = () => {
    this.refreshOutstandingOrders()
  }

  refreshOutstandingOrders = () => {
    this.props.dispatch(fetchOutstandingOrders())
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

      // any non-empty line must be valid
      if (line.length > 0 && !isValidOrderId(line)) {
        this.setState({ errorMessage: '订单号格式错误' })
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
    const value = e.target.value.replace('\n\n', '\n').toUpperCase()
    const lines = value.split('\n')

    // if any line is in the wrong format do not update
    for (let i = 0; i < lines.length; i++) {
      if (!isValidOrderId(lines[i], true)) {
        return
      }
    }

    this.setState({ orderIds: value, errorMessage: '' })
  }

  render = () => {
    const { orders, classes } = this.props

    return (
      <div>
        <ShipmentList className={classes.orderList} orders={orders} />

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

const mapStateToProps = state => ({
  orders: state.shipment.outstandingOrders
})

export default compose(connect(mapStateToProps), withStyles(styles))(
  ShipmentForm
)
