import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import compose from 'recompose/compose'

import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import Paper from 'material-ui/Paper'
import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table'

import { jsonrpc, message } from 'homemaster-jslib'
import PaperPlaneIcon from 'homemaster-jslib/svg-icons/PaperPlane'

import { fetchOutstandingOrders } from 'model/actions'
import dateFormat from 'utils/date-fns'
import EnhancedTableHead from 'widget/TableHead'

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: 400
  },
  orderTable: {
    flexBasis: '50%',
    flexGrow: 0
  },
  inputForm: {
    flexBasis: '50%',
    maxWidth: 700,
    padding: 16,
    flexGrow: 0
  },
  rowNumber: {
    textAlign: 'center'
  },
  orderId: theme.custom.orderId,
  submitButton: theme.custom.submitButton,
  buttonRow: theme.custom.buttonRow,
  buttonIcon: theme.custom.buttonIcon
})

const columns = [
  { id: 'rowNumber', disablePadding: true, label: '' },
  { id: 'externalOrderId', disablePadding: true, label: '订单号' },
  { id: 'storeId', disablePadding: true, label: '商场号' },
  { id: 'customerName', disablePadding: false, label: '顾客姓名' },
  { id: 'customerRegionName', disablePadding: false, label: '顾客地区' },
  { id: 'scheduledInstallationDate', disablePadding: false, label: '安装日期' }
]

class ShipmentForm extends Component {
  state = {
    orderIds: '',
    errorMessage: '',

    // below are used by the grid
    data: [],
    order: 'desc',
    orderBy: 'scheduledInstallationDate'
  }

  componentDidMount = () => {
    this.refreshOutstandingOrders()
  }

  componentWillReceiveProps = nextProps => {
    // make a copy of the process data
    if (this.props.orders !== nextProps.orders) {
      this.setState({ data: nextProps.orders.slice() })
    }
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

  handleRequestSort = (event, property) => {
    const orderBy = property
    let order = 'desc'

    if (this.state.orderBy === property && this.state.order === 'desc') {
      order = 'asc'
    }

    const data =
      order === 'desc'
        ? this.state.data.sort(
            (a, b) =>
              b[orderBy] < a[orderBy] || b[orderBy] === undefined ? -1 : 1
          )
        : this.state.data.sort((a, b) => {
            return a[orderBy] < b[orderBy] || b[orderBy] === undefined ? -1 : 1
          })

    this.setState({ data, order, orderBy })
  }

  render = () => {
    const { classes } = this.props
    const { data, order, orderBy } = this.state

    return (
      <div className={classes.root}>
        <Table className={classes.orderTable}>
          <EnhancedTableHead
            columns={columns}
            order={order}
            orderBy={orderBy}
            onRequestSort={this.handleRequestSort}
          />
          <TableBody>
            {data.map((p, idx) => (
              <TableRow hover tabIndex={-1} key={idx}>
                <TableCell className={classes.rowNumber} padding="none">
                  {idx + 1}
                </TableCell>
                <TableCell padding="none">{p.externalOrderId}</TableCell>
                <TableCell padding="none">{p.storeId}</TableCell>
                <TableCell padding="none">{p.customerName}</TableCell>
                <TableCell padding="none">{p.customerRegionName}</TableCell>
                <TableCell>
                  {dateFormat(p.scheduledInstallationDate, 'YYYY/MM/DD')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

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

ShipmentForm.propTypes = {
  /**
   * The orders that are waiting to be shipped
   */
  orders: PropTypes.arrayOf(PropTypes.object)
}

const mapStateToProps = state => ({
  orders: state.shipment.outstandingOrders
})

export default compose(connect(mapStateToProps), withStyles(styles))(
  ShipmentForm
)
