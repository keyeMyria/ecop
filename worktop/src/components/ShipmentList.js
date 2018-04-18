/* global App */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import update from 'immutability-helper'
import addDays from 'date-fns/addDays'
import formatDistance from 'date-fns/formatDistance'
import zh_CN from 'date-fns/esm/locale/zh-CN'

import { withStyles } from 'material-ui/styles'
import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table'
import AlarmIcon from '@material-ui/icons/Alarm'
import Toolbar from 'material-ui/Toolbar'
import Tooltip from 'material-ui/Tooltip'
import Typography from 'material-ui/Typography'
import Paper from 'material-ui/Paper'
import IconButton from 'material-ui/IconButton'
import Checkbox from 'material-ui/Checkbox'
import { lighten } from 'material-ui/styles/colorManipulator'
import PrintIcon from '@material-ui/icons/Print'

import dateFormat from 'utils/date-fns'
import EnhancedTableHead from 'widget/TableHead'

const toolbarStyles = theme => ({
  root: {
    paddingRight: theme.spacing.unit
  },
  highlight:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85)
        }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark
        },
  spacer: {
    flex: '1 1 100%'
  },
  actions: {
    color: theme.palette.text.secondary
  },
  title: {
    flex: '0 0 auto'
  }
})

let EnhancedTableToolbar = props => {
  const { numSelected, classes, labelUrl } = props

  return (
    <Toolbar
      className={classNames(classes.root, {
        [classes.highlight]: numSelected > 0
      })}
    >
      <div className={classes.title}>
        {numSelected > 0 ? (
          <Typography color="inherit" variant="subheading">
            选中{numSelected}个订单
          </Typography>
        ) : (
          <Typography variant="title">待发货订单</Typography>
        )}
      </div>
      <div className={classes.spacer} />
      <div className={classes.actions}>
        {numSelected > 0 && (
          <Tooltip title="打印标签">
            <IconButton href={labelUrl} target="_blank">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </Toolbar>
  )
}

EnhancedTableToolbar.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
  labelUrl: PropTypes.string
}

EnhancedTableToolbar = withStyles(toolbarStyles)(EnhancedTableToolbar)

const styles = theme => ({
  rowNumber: {
    textAlign: 'center'
  },
  warning: {
    width: 20
  },
  checkbox: {
    width: 40
  }
})

const columns = [
  { id: 'warning', disablePadding: true, label: '' },
  { id: 'rowNumber', disablePadding: true, label: '' },
  { id: 'externalOrderId', disablePadding: true, label: '订单号' },
  { id: 'factoryNumber', disablePadding: true, label: '工厂编号' },
  { id: 'customerName', disablePadding: true, label: '顾客姓名' },
  { id: 'customerRegionName', disablePadding: true, label: '顾客地区' },
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
    selected: [],
    order: 'desc',
    orderBy: 'due'
  }

  componentWillReceiveProps = nextProps => {
    if (this.props.orders !== nextProps.orders) {
      const today = new Date()

      this.setState(
        {
          selected: [],
          data: nextProps.orders.map(activity => {
            const due = addDays(new Date(activity.startTime), 7)

            return update(activity, {
              due: { $set: due },
              overDue: {
                $set:
                  today > due
                    ? formatDistance(today, due, { locale: zh_CN })
                    : null
              }
            })
          })
        },
        this.handleRequestSort.bind(null, this.state.orderBy)
      )
    }
  }

  handleSelectAllClick = (evt, checked) => {
    this.setState({
      selected: checked ? this.state.data.map(e => e.orderId) : []
    })
  }

  handleClick = (event, id) => {
    const { selected } = this.state
    const selectedIndex = selected.indexOf(id)
    let newSelected = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      )
    }

    this.setState({ selected: newSelected })
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

  isSelected = id => this.state.selected.indexOf(id) !== -1

  render = () => {
    const { classes, dispatch, ...other } = this.props
    const { data, selected, order, orderBy } = this.state
    const labelUrl = `/ikea/shippingLabel?orders=${selected.join(',')}&token=${
      App.csrfToken
    }`

    return (
      <Paper>
        <EnhancedTableToolbar
          numSelected={selected.length}
          labelUrl={labelUrl}
        />
        <Table {...other}>
          <EnhancedTableHead
            columns={columns}
            order={order}
            orderBy={orderBy}
            onRequestSort={this.handleRequestSort}
            onSelectAllClick={this.handleSelectAllClick}
            numSelected={selected.length}
            rowCount={data.length}
          />
          <TableBody>
            {data.map((p, idx) => {
              const isSelected = this.isSelected(p.orderId)
              return (
                <TableRow
                  hover
                  tabIndex={-1}
                  key={p.orderId}
                  selected={isSelected}
                  onClick={e => this.handleClick(e, p.orderId)}
                >
                  <TableCell className={classes.checkbox} padding="none">
                    <Checkbox checked={isSelected} />
                  </TableCell>
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
      </Paper>
    )
  }
}

ShipmentList.propTypes = {
  /**
   * The orders that are waiting to be shipped
   */
  orders: PropTypes.arrayOf(PropTypes.object)
}

export default withStyles(styles)(ShipmentList)
