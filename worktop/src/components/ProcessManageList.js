import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import compose from 'recompose/compose'

import { withStyles } from 'material-ui/styles'
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel
} from 'material-ui/Table'
import { searchProcess } from 'model/actions'

const styles = {
  root: {}
}

const columns = [
  {
    id: 'externalOrderId',
    numeric: false,
    disablePadding: true,
    label: '订单号'
  },
  { id: 'startTime', numeric: true, disablePadding: false, label: '开始时间' },
  { id: 'endTime', numeric: true, disablePadding: false, label: '完成时间' },
  { id: 'status', numeric: true, disablePadding: false, label: '状态' }
]

class EnhancedTableHead extends Component {
  createSortHandler = property => event => {
    this.props.onRequestSort(event, property)
  }

  render() {
    const { order, orderBy } = this.props

    return (
      <TableHead>
        <TableRow>
          {columns.map(column => {
            return (
              <TableCell
                key={column.id}
                numeric={column.numeric}
                padding={column.disablePadding ? 'none' : 'default'}
                sortDirection={orderBy === column.id ? order : false}
              >
                <TableSortLabel
                  active={orderBy === column.id}
                  direction={order}
                  onClick={this.createSortHandler(column.id)}
                >
                  {column.label}
                </TableSortLabel>
              </TableCell>
            )
          }, this)}
        </TableRow>
      </TableHead>
    )
  }
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.string.isRequired,
  orderBy: PropTypes.string.isRequired
}

class ProcessManageList extends Component {
  state = {
    data: [],
    order: 'asc',
    orderBy: 'startTime'
  }

  componentWillReceiveProps = nextProps => {
    // make a copy of the process data
    if (this.props.processes !== nextProps.processese) {
      this.setState({ data: nextProps.processes.slice() })
    }
  }

  componentDidMount = () => {
    this.refresh()
  }

  refresh = () => {
    this.props.dispatch(searchProcess())
  }

  handleRequestSort = () => {}

  render() {
    const { classes } = this.props
    const { data, order, orderBy } = this.state

    return (
      <Table className={classes.table}>
        <EnhancedTableHead
          order={order}
          orderBy={orderBy}
          onRequestSort={this.handleRequestSort}
        />
        <TableBody>
          {data.map(n => (
            <TableRow hover role="checkbox" tabIndex={-1} key={n.id}>
              <TableCell padding="none">{n.businessKey}</TableCell>
              <TableCell>{n.startTime}</TableCell>
              <TableCell>{n.endTime}</TableCell>
              <TableCell numeric>{n.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
}

ProcessManageList.propTypes = {
  /**
   * A list of camunda `process` objects in prop `processes`
   */
  processes: PropTypes.arrayOf(PropTypes.object)
}

const mapStateToProps = state => ({
  processes: state.process.processList
})

export default compose(connect(mapStateToProps), withStyles(styles))(
  ProcessManageList
)
