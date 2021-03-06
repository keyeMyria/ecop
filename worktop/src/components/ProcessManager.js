/* global App */
import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'
import validation from 'react-validation-mixin'
import update from 'immutability-helper'
import compose from 'recompose/compose'
import subMonths from 'date-fns/subMonths'
import startOfDay from 'date-fns/startOfDay'
import queryString from 'query-string'

import { withStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import Button from '@material-ui/core/Button'
import Paper from '@material-ui/core/Paper'
import Toolbar from '@material-ui/core/Toolbar'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import PreviewIcon from '@material-ui/icons/RemoveRedEye'
import SearchIcon from '@material-ui/icons/Search'
import ArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft'
import ArrowRightIcon from '@material-ui/icons/KeyboardArrowRight'
import DatePicker from 'material-ui-pickers/DatePicker'

import { strategy, ValidatedForm } from 'form'
import { downloadFile, jsonrpc } from 'homemaster-jslib'
import ExcelIcon from 'homemaster-jslib/svg-icons/Excel'

import { searchProcess } from 'model/actions'
import dateFormat from 'utils/date-fns'
import EnhancedTableHead from 'widget/TableHead'
/**
 * TODO: Due to IE InputAdornment positioning problem, we are temporarily
 * disabling the usage of InputField
 */
//import InputField from 'widget/InputField'
import VariablesForm from './VariablesForm'
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
  textField: {
    flexBasis: 200
  },
  searchField: {
    margin: theme.spacing.unit
  },
  dateField: {
    flexBasis: 100
  },
  button: {
    marginRight: theme.spacing.unit
  }
})

class SearchToolbar extends ValidatedForm {
  state = {
    values: {
      searchText: '',
      startDate: subMonths(startOfDay(new Date()), 1),
      endDate: startOfDay(new Date()),
      completed: false
    }
  }

  validatorTypes = strategy.createInactiveSchema(
    {
      searchText: 'min:2'
    },
    {
      'min.searchText': '搜索内容长度至少为2个字符'
    }
  )

  componentDidMount = () => {
    this.doSearch()
  }

  doSearch = () => {
    this.props.dispatch(searchProcess(this.state.values))
  }

  handleSearch = () => {
    this.props.validate(error => {
      !error && this.doSearch()
    })
  }

  handleExport = () => {
    this.props.validate(error => {
      if (!error) {
        jsonrpc({
          method: 'bpmn.process.list.checkCount',
          params: [this.state.values]
        }).then(() => {
          const params = {
            /**
             * To correctly convert javascript Date object to string, we shall
             * use JSON.stringify, not Date.toString
             */
            c: btoa(JSON.stringify(this.state.values)),
            token: App.csrfToken
          }
          downloadFile(
            `/ikea/processlist?${queryString.stringify(params)}`,
            undefined,
            false
          )
        })
      }
    })
  }

  render() {
    const { classes } = this.props
    const { values } = this.state

    return (
      <Toolbar
        classes={{ root: classes.root }}
        onKeyDown={e => e.keyCode === 13 && this.handleSearch()}
      >
        <Field
          component={TextField}
          className={classNames(classes.searchField, classes.textField)}
          name="searchText"
          label="订单号/手机号/顾客姓名"
          required={false}
          form={this}
          clearable
          onChange={e => {
            var { value } = e.target
            this.setState(
              {
                values: update(values, {
                  searchText: { $set: value.trim() }
                })
              },
              this.props.validate
            )
          }}
        />

        <Field
          component={DatePicker}
          name="startDate"
          className={classNames(classes.searchField, classes.dateField)}
          label="起始日期"
          required={false}
          clearable
          autoOk
          disableFuture
          leftArrowIcon={<ArrowLeftIcon />}
          rightArrowIcon={<ArrowRightIcon />}
          maxDate={values.endDate || undefined}
          labelFunc={date => dateFormat(date, 'YYYY/MM/DD')}
          form={this}
          onChange={this.handleChange('startDate', 'datepicker')}
        />

        <Field
          component={DatePicker}
          name="endDate"
          className={classNames(classes.searchField, classes.dateField)}
          label="结束日期"
          required={false}
          clearable
          autoOk
          disableFuture
          minDate={values.startDate || undefined}
          leftArrowIcon={<ArrowLeftIcon />}
          rightArrowIcon={<ArrowRightIcon />}
          labelFunc={date => dateFormat(date, 'YYYY/MM/DD')}
          form={this}
          onChange={this.handleChange('endDate', 'datepicker')}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={values.completed}
              onChange={e => {
                this.setState({
                  values: update(values, {
                    completed: { $set: e.target.checked }
                  })
                })
              }}
              value="completed"
            />
          }
          label="已完成订单"
        />

        <Button
          className={classes.button}
          variant="raised"
          color="primary"
          onClick={this.handleSearch}
        >
          <SearchIcon /> &nbsp;搜&nbsp;索
        </Button>

        <Button
          className={classes.button}
          variant="raised"
          color="primary"
          onClick={this.handleExport}
        >
          <ExcelIcon /> &nbsp;导出Excel
        </Button>
      </Toolbar>
    )
  }
}

SearchToolbar.propTypes = {
  dispatch: PropTypes.func.isRequired
}
SearchToolbar = compose(withStyles(toolbarStyles), validation(strategy))(
  SearchToolbar
)

const listStyles = theme => ({
  rowNumber: {
    textAlign: 'center'
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

const columns = [
  { id: 'rowNumber', disablePadding: true, label: '' },
  { id: 'externalOrderId', disablePadding: true, label: '订单号' },
  { id: 'storeId', disablePadding: true, label: '商场号' },
  { id: 'customerName', disablePadding: true, label: '顾客姓名' },
  { id: 'orderItem', disablePadding: true, label: '台面' },
  { id: 'startTime', disablePadding: true, label: '发起时间' },
  {
    id: 'scheduledMeasurementDate',
    disablePadding: true,
    label: '预约测量日'
  },
  {
    id: 'confirmedMeasurementDate',
    disablePadding: true,
    label: '确认测量日'
  },
  { id: 'actualMeasurementDate', disablePadding: true, label: '实际测量日' },
  {
    id: 'scheduledInstallationDate',
    disablePadding: true,
    label: '预约安装日'
  },
  {
    id: 'confirmedInstallationDate',
    disablePadding: true,
    label: '确认安装日'
  },
  { id: 'actualInstallationDate', disablePadding: true, label: '实际安装日' },
  { id: 'duration', disablePadding: true, label: '耗时' },
  { id: 'status', disablePadding: true, label: '状态' },
  { id: 'action', disablePadding: true }
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
        <Table>
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
                <TableCell padding="none">
                  {p.orderItems &&
                    p.orderItems.map((oi, idx) => (
                      <div key={idx}>
                        {oi.model}*{oi.quantity}
                      </div>
                    ))}
                </TableCell>

                <TableCell padding="none">
                  {dateFormat(p.startTime, 'YYYY/MM/DD HH:mm')}
                </TableCell>
                <TableCell
                  padding="none"
                  className={
                    (!p.scheduledMeasurementDate && classes.na) || null
                  }
                >
                  {p.scheduledMeasurementDate
                    ? dateFormat(p.scheduledMeasurementDate, 'YYYY/MM/DD')
                    : '无需测量'}
                </TableCell>
                <TableCell padding="none">
                  {dateFormat(p.confirmedMeasurementDate, 'YYYY/MM/DD')}
                </TableCell>
                <TableCell padding="none">
                  {dateFormat(p.actualMeasurementDate, 'YYYY/MM/DD')}
                </TableCell>
                <TableCell
                  padding="none"
                  className={
                    (p.isInstallationRequested === false && classes.na) || null
                  }
                >
                  {p.isInstallationRequested === false
                    ? '无需安装'
                    : dateFormat(p.scheduledInstallationDate, 'YYYY/MM/DD')}
                </TableCell>
                <TableCell padding="none">
                  {dateFormat(p.confirmedInstallationDate, 'YYYY/MM/DD')}
                </TableCell>
                <TableCell padding="none">
                  {dateFormat(p.actualInstallationDate, 'YYYY/MM/DD')}
                </TableCell>
                <TableCell padding="none">{p.duration}</TableCell>
                <TableCell padding="none">{p.statusText}</TableCell>
                <TableCell padding="none">
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
            ))}
          </TableBody>
        </Table>
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
          <SearchToolbar dispatch={this.props.dispatch} />
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
