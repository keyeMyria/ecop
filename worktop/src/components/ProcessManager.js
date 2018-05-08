import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'
import validation from 'react-validation-mixin'
import compose from 'recompose/compose'

import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table'
import Button from 'material-ui/Button'
import Paper from 'material-ui/Paper'
import Toolbar from 'material-ui/Toolbar'
import TextField from 'material-ui/TextField'
import Typography from 'material-ui/Typography'
import IconButton from 'material-ui/IconButton'
import { withStyles } from 'material-ui/styles'
import green from 'material-ui/colors/green'
import PreviewIcon from '@material-ui/icons/RemoveRedEye'
import SearchIcon from '@material-ui/icons/Search'

import { strategy, ValidatedForm } from 'form'
import CheckboxBlankCircle from 'homemaster-jslib/svg-icons/CheckboxBlankCircle'

import { searchProcess } from 'model/actions'
import dateFormat from 'utils/date-fns'
import EnhancedTableHead from 'widget/TableHead'
/**
 * TODO: Due to IE InputAdornment positioning problem, we are temporarily
 * disabling the usage of InputField
 */
//import InputField from 'widget/InputField'
import VariablesForm from './VariablesForm'
import { isValidOrderId } from 'utils/validators'
import { Field } from '../form'

const toolbarStyles = theme => ({
  root: {
    paddingLeft: 0,
    paddingRight: 0
  },
  /**
   * TODO: Due to a bug the placement of clear icon in IE 11, we have to set
   * the flexBasis to at least 200. Otherwise the clear icon will be placed
   * outside of the TextField
   */
  searchField: {
    flexBasis: 200,
    margin: theme.spacing.unit
  }
})

class SearchToolbar extends ValidatedForm {
  state = {
    values: {
      orderId: '',
      customerMobile: '',
      customerName: ''
    }
  }

  validatorTypes = strategy.createInactiveSchema(
    {
      orderId: 'IKEAOrderId',
      customerMobile: 'mobile',
      customerName: 'min:2'
    },
    {
      'IKEAOrderId.orderId': '订单号格式不对',
      'min.customerName': '顾客名称长度至少为2个字符'
    }
  )

  handleSearch = () => {
    this.props.validate(error => {
      !error && this.props.onSearch(this.state.values)
    })
  }

  render() {
    const { classes } = this.props

    return (
      <Toolbar
        classes={{ root: classes.root }}
        onKeyDown={e => e.keyCode === 13 && this.handleSearch()}
      >
        <Field
          component={TextField}
          className={classes.searchField}
          name="orderId"
          label="订单号"
          required={false}
          form={this}
          clearable
          onChange={e => {
            var { value } = e.target
            if (!value || isValidOrderId(value, true)) {
              this.setState(
                {
                  values: {
                    orderId: value.toUpperCase(),
                    customerMobile: '',
                    customerName: ''
                  }
                },
                this.props.validate
              )
            }
          }}
        />

        <Field
          component={TextField}
          className={classes.searchField}
          name="customerMobile"
          label="顾客手机号"
          required={false}
          form={this}
          clearable
          onChange={e => {
            var { value } = e.target
            // allow only numbers and max 11
            if (/^1\d{0,10}$/.test(value) || !value) {
              this.setState(
                {
                  values: {
                    customerMobile: value,
                    customerName: '',
                    orderId: ''
                  }
                },
                this.props.validate
              )
            }
          }}
        />

        <Field
          component={TextField}
          className={classes.searchField}
          name="customerName"
          label="顾客名称"
          required={false}
          form={this}
          onChange={e => {
            this.setState(
              {
                values: {
                  customerName: e.target.value.trim(),
                  customerMobile: '',
                  orderId: ''
                }
              },
              this.props.validate
            )
          }}
          clearable
        />

        <Button variant="raised" color="primary" onClick={this.handleSearch}>
          <SearchIcon /> &nbsp;搜&nbsp;索
        </Button>
      </Toolbar>
    )
  }
}

SearchToolbar.propTypes = {
  onSearch: PropTypes.func.isRequired
}
SearchToolbar = compose(withStyles(toolbarStyles), validation(strategy))(
  SearchToolbar
)

const listStyles = theme => ({
  rowNumber: {
    textAlign: 'center'
  },
  actual: {
    color: green[500]
  },
  confirmed: {
    color: theme.palette.primary.main
  },
  na: {
    color: theme.palette.secondary.main
  },
  legend: {
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2
  },
  legendLabel: {
    verticalAlign: 'middle',
    marginLeft: '1em'
  },
  notfound: {
    padding: theme.spacing.unit * 2
  }
})

const statusName = {
  ACTIVE: '进行中',
  EXTERNALLY_TERMINATED: '已取消',
  COMPLETED: '已完成',
  INTERNALLY_TERMINATED: '已取消'
}

const columns = [
  { id: 'rowNumber', disablePadding: true, label: '' },
  { id: 'externalOrderId', disablePadding: true, label: '订单号' },
  { id: 'storeId', disablePadding: true, label: '商场号' },
  { id: 'customerName', disablePadding: false, label: '顾客姓名' },
  { id: 'customerRegionName', disablePadding: false, label: '顾客地区' },
  { id: 'startTime', disablePadding: false, label: '发起时间' },
  { id: 'actualMeasurementDate', disablePadding: false, label: '测量日期' },
  { id: 'receivingDate', disablePadding: false, label: '收货日期' },
  { id: 'actualInstallationDate', disablePadding: false, label: '安装日期' },
  { id: 'status', disablePadding: false, label: '状态' },
  { id: 'action', disablePadding: false }
]

class ProcessList extends Component {
  state = {
    order: 'desc',
    orderBy: 'startTime'
  }

  handleRequestSort = columnId => {
    const orderBy = columnId
    let order = 'desc'

    if (this.state.orderBy === columnId && this.state.order === 'desc') {
      order = 'asc'
    }
    if (order === 'desc') {
      this.props.data.sort(
        (a, b) => (b[orderBy] < a[orderBy] || b[orderBy] === undefined ? -1 : 1)
      )
    } else {
      this.props.data.sort((a, b) => {
        return a[orderBy] < b[orderBy] || b[orderBy] === undefined ? -1 : 1
      })
    }

    this.setState({ order, orderBy })
  }

  render() {
    const { classes, data } = this.props
    const { order, orderBy } = this.state

    if (data === undefined) return null

    if (data.length === 0) {
      return (
        <Typography variant="subheading" className={classes.notfound}>
          没有符合条件的订单
        </Typography>
      )
    } else {
      return (
        <Fragment>
          <Table>
            <EnhancedTableHead
              columns={columns}
              order={order}
              orderBy={orderBy}
              onRequestSort={this.handleRequestSort}
            />
            <TableBody>
              {data.map((p, idx) => {
                const measureDate =
                  p.actualMeasurementDate ||
                  p.confirmedMeasurementDate ||
                  p.scheduledMeasurementDate

                return (
                  <TableRow hover tabIndex={-1} key={idx}>
                    <TableCell className={classes.rowNumber} padding="none">
                      {idx + 1}
                    </TableCell>
                    <TableCell padding="none">{p.externalOrderId}</TableCell>
                    <TableCell padding="none">{p.storeId}</TableCell>
                    <TableCell padding="none">{p.customerName}</TableCell>
                    <TableCell padding="none">{p.customerRegionName}</TableCell>
                    <TableCell padding="none">
                      {dateFormat(p.startTime, 'YYYY/MM/DD HH:mm:ss')}
                    </TableCell>
                    <TableCell
                      className={
                        (p.actualMeasurementDate && classes.actual) ||
                        (p.confirmedMeasurementDate && classes.confirmed) ||
                        (!measureDate && classes.na) ||
                        null
                      }
                    >
                      {measureDate
                        ? dateFormat(measureDate, 'YYYY/MM/DD')
                        : '无需测量'}
                    </TableCell>
                    <TableCell className={classes.actual}>
                      {dateFormat(p.receivingDate, 'YYYY/MM/DD')}
                    </TableCell>
                    <TableCell
                      className={
                        (p.actualInstallationDate && classes.actual) ||
                        (p.confirmedInstallationDate && classes.confirmed)
                      }
                    >
                      {dateFormat(
                        p.actualInstallationDate ||
                          p.confirmedInstallationDate ||
                          p.scheduledInstallationDate,
                        'YYYY/MM/DD'
                      )}
                    </TableCell>
                    <TableCell>{statusName[p.state]}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          this.props.onProcessAction(p.id, 'view')
                        }}
                      >
                        <PreviewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <Typography variant="subheading" className={classes.legend}>
            <CheckboxBlankCircle className={classes.legendLabel} /> - 预约日期
            <CheckboxBlankCircle
              className={classNames(classes.legendLabel, classes.confirmed)}
            />{' '}
            - 确认日期
            <CheckboxBlankCircle
              className={classNames(classes.legendLabel, classes.actual)}
            />{' '}
            - 实际完成日期
          </Typography>
        </Fragment>
      )
    }
  }
}

ProcessList.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  /**
   * When user initiates an action for a process in the list, call this func
   * with the processInstanceId and the action name
   */
  onProcessAction: PropTypes.func.isRequired
}

ProcessList = withStyles(listStyles)(ProcessList)

class ProcessManager extends Component {
  state = {
    form: {
      open: false,
      processInstanceId: null
    }
  }

  componentDidMount = () => {
    this.doSearch()
  }

  doSearch = cond => {
    this.props.dispatch(searchProcess(cond))
  }

  openVariableForm = processInstanceId => {
    this.setState({
      form: {
        open: true,
        processInstanceId
      }
    })
  }

  render() {
    const { form } = this.state

    return (
      <Fragment>
        <Paper style={{ marginBottom: 16 }}>
          <SearchToolbar onSearch={cond => this.doSearch(cond)} />
        </Paper>
        <Paper>
          <ProcessList
            data={this.props.processes}
            onProcessAction={this.openVariableForm}
          />
        </Paper>

        <VariablesForm
          {...form}
          onClose={() => {
            this.setState({
              form: {
                open: false,
                processInstanceId: null
              }
            })
          }}
        />
      </Fragment>
    )
  }
}

ProcessManager.propTypes = {
  /**
   * A list of camunda `process` objects in prop `processes`
   */
  processes: PropTypes.arrayOf(PropTypes.object)
}

export default connect(state => ({
  processes: state.process.processList
}))(ProcessManager)
