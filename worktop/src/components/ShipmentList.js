import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import compose from 'recompose/compose'
import addDays from 'date-fns/addDays'
import formatDistance from 'date-fns/formatDistance'
import zh_CN from 'date-fns/esm/locale/zh-CN'

import { withStyles } from 'material-ui/styles'
import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table'
import AlarmIcon from '@material-ui/icons/Alarm'

import dateFormat from 'utils/date-fns'
import EnhancedTableHead from 'widget/TableHead'

import { fetchOutstandingOrders } from 'model/actions'

const styles = theme => ({
  rowNumber: {
    textAlign: 'center'
  },
  warning: {
    width: 20
  }
})

const columns = [
  { id: 'warning', disablePadding: true, label: '' },
  { id: 'rowNumber', disablePadding: true, label: '' },
  { id: 'externalOrderId', disablePadding: true, label: '订单号' },
  { id: 'factoryNumber', disablePadding: true, label: '工厂编号' },
  { id: 'customerName', disablePadding: false, label: '顾客姓名' },
  { id: 'customerRegionName', disablePadding: false, label: '顾客地区' },
  { id: 'startTime', disablePadding: false, label: '审核通过日期' },
  { id: 'due', disablePadding: false, label: '最迟发货日期' },
  { id: 'overDue', disablePadding: false, label: '逾期时间' },
  {
    id: 'scheduledInstallationDate',
    disablePadding: false,
    label: '预约安装日期'
  }
]

class ShipmentList extends Component {
  state = {
    data: [],
    order: 'desc',
    orderBy: 'due'
  }

  componentDidMount = () => {
    this.refreshOutstandingOrders()
  }

  componentWillReceiveProps = nextProps => {
    if (this.props.orders !== nextProps.orders) {
      const today = new Date()

      this.setState(
        {
          data: nextProps.orders.map(activity => {
            const due = addDays(new Date(activity.startTime), 7)
            const {
              externalOrderId,
              factoryNumber,
              customerName,
              customerRegionName,
              startTime,
              scheduledInstallationDate
            } = activity

            return {
              externalOrderId,
              factoryNumber,
              customerName,
              customerRegionName,
              startTime,
              due: due,
              overDue:
                today > due
                  ? formatDistance(today, due, { locale: zh_CN })
                  : null,
              scheduledInstallationDate
            }
          })
        },
        this.handleRequestSort.bind(null, this.state.orderBy)
      )
    }
  }

  refreshOutstandingOrders = () => {
    this.props.dispatch(fetchOutstandingOrders())
  }

  handleRequestSort = columnId => {
    const orderBy = columnId
    let order = 'desc'

    if (this.state.orderBy === columnId && this.state.order === 'desc') {
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
    const { classes, dispatch, ...other } = this.props
    const { data, order, orderBy } = this.state

    return (
      <Table {...other}>
        <EnhancedTableHead
          columns={columns}
          order={order}
          orderBy={orderBy}
          onRequestSort={this.handleRequestSort}
        />
        <TableBody>
          {data.map((p, idx) => {
            return (
              <TableRow hover tabIndex={-1} key={idx}>
                <TableCell className={classes.warning} padding="none">
                  {p.overDue && <AlarmIcon color="error" />}
                </TableCell>
                <TableCell className={classes.rowNumber} padding="none">
                  {idx + 1}
                </TableCell>
                <TableCell padding="none">{p.externalOrderId}</TableCell>
                <TableCell padding="none">{p.factoryNumber}</TableCell>
                <TableCell padding="none">{p.customerName}</TableCell>
                <TableCell padding="none">{p.customerRegionName}</TableCell>
                <TableCell>{dateFormat(p.startTime, 'YYYY/MM/DD')}</TableCell>
                <TableCell>{dateFormat(p.due, 'YYYY/MM/DD')}</TableCell>
                <TableCell>{p.overDue}</TableCell>
                <TableCell>
                  {dateFormat(p.scheduledInstallationDate, 'YYYY/MM/DD')}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    )
  }
}

ShipmentList.propTypes = {
  /**
   * The orders that are waiting to be shipped
   */
  orders: PropTypes.arrayOf(PropTypes.object)
}

const mapStateToProps = state => ({
  orders: state.shipment.outstandingOrders
})

export default compose(connect(mapStateToProps), withStyles(styles))(
  ShipmentList
)
