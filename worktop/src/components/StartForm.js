/* global App */
import React from 'react'
import validation from 'react-validation-mixin'
import compose from 'recompose/compose'
import update from 'immutability-helper'

import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import DatePicker from 'material-ui-pickers/DatePicker'
import Grid from 'material-ui/Grid'
import Paper from 'material-ui/Paper'
import { FormControlLabel } from 'material-ui/Form'
import Checkbox from 'material-ui/Checkbox'
import ArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft'
import ArrowRightIcon from '@material-ui/icons/KeyboardArrowRight'

import { jsonrpc, message } from 'homemaster-jslib'
import RegionPicker from 'homemaster-jslib/region/RegionPicker'
import PaperPlaneIcon from 'homemaster-jslib/svg-icons/PaperPlane'
import CloseBox from 'homemaster-jslib/svg-icons/CloseBox'

import { strategy, ValidatedForm, Field } from 'form'
import FileUploader from 'widget/FileUploader'
import dateFormat from 'utils/date-fns'

const styles = theme => ({
  root: {
    maxWidth: 700,
    padding: 16
  },
  orderId: theme.custom.orderId,
  submitButton: theme.custom.submitButton,
  buttonRow: theme.custom.buttonRow,
  buttonIcon: theme.custom.buttonIcon,
  measurementNotRequested: {
    color: theme.palette.secondary.main
  }
})

class StartForm extends ValidatedForm {
  defaultValues = {
    externalOrderId: '',
    storeId: '',
    customerName: '',
    customerMobile: '',
    customerRegionCode: null,
    customerStreet: '',
    isMeasurementRequested: true,
    scheduledMeasurementDate: null,
    scheduledInstallationDate: null,
    orderFile: []
  }

  validatorTypes = strategy.createInactiveSchema(
    {
      externalOrderId: 'size:9',
      storeId: 'required|size:3|in:856,885,247',
      customerName: 'required',
      customerMobile: 'required|mobile',
      customerRegionCode: 'required',
      customerStreet: 'required',
      scheduledMeasurementDate: [
        { required_if: ['isMeasurementRequested', true] }
      ],
      orderFile: 'required'
    },
    {
      'size.externalOrderId': '宜家订单号长度为9位',
      'required.storeId': '宜家商场号必须输入',
      'in.storeId': '商场号错误',
      'size.storeId': '宜家商场号长度为3位',
      'required.customerName': '顾客名称必须输入',
      'required.customerMobile': '顾客手机必须输入',
      'required.customerStreet': '详细地址必须输入',
      'required.customerRegionCode': '所在地区必须输入',
      'required_if.scheduledMeasurementDate': '预约测量日期必须输入',
      'required.orderFile': '原始订单必须上传'
    }
  )

  constructor(props) {
    super(props)
    this.state = { values: this.defaultValues }
  }

  resetForm = () => {
    this.setState({ values: this.defaultValues })
  }

  /**
   * Whenever `isMeasurementRequested` is set to false, clear the variable
   * `scheduledMeasurementDate`
   */
  handleChangeMeasurementRequested = e => {
    this.setState({
      values: update(this.state.values, {
        isMeasurementRequested: {
          $set: !this.state.values.isMeasurementRequested
        },
        scheduledMeasurementDate: {
          $set: null
        }
      })
    })
  }

  handleSubmit = () => {
    this.props.validate(error => {
      if (!error) {
        jsonrpc({
          method: 'bpmn.process.start',
          params: [App.processKey, this.state.values]
        }).then(() => {
          message.success('订单提交成功')
          this.resetForm()
        })
      }
    })
  }

  render = () => {
    const { classes } = this.props
    const { values } = this.state

    return (
      <Paper className={classes.root}>
        <Grid container justify="space-between">
          <Grid item xs={5}>
            <Field
              component={TextField}
              name="externalOrderId"
              label="订单号"
              required={false}
              autoFocus
              InputProps={{ classes: { input: classes.orderId } }}
              value={values.externalOrderId}
              onBlur={this.activateValidation('externalOrderId')}
              onChange={e => {
                var { value } = e.target
                if (/^\d{0,9}$/.test(value) || !value) {
                  this.setState(
                    { values: { ...values, externalOrderId: value } },
                    this.props.handleValidation('externalOrderId')
                  )
                }
              }}
              error={!!this.getFieldError('externalOrderId')}
              helperText={this.getFieldError('externalOrderId')}
            />
          </Grid>

          <Grid item xs={4}>
            <Field
              component={TextField}
              name="storeId"
              label="宜家商场号"
              value={values.storeId}
              onBlur={this.activateValidation('storeId')}
              onChange={e => {
                var { value } = e.target
                if (/^\d{0,3}$/.test(value) || !value) {
                  this.setState(
                    { values: { ...values, storeId: value } },
                    this.props.handleValidation('storeId')
                  )
                }
              }}
              error={!!this.getFieldError('storeId')}
              helperText={this.getFieldError('storeId')}
            />
          </Grid>
        </Grid>

        <Grid container justify="center" spacing={24}>
          <Grid item xs={6}>
            <Field
              component={TextField}
              name="customerName"
              label="顾客名称"
              value={values.customerName}
              onChange={this.handleChange('customerName')}
              error={!!this.getFieldError('customerName')}
              helperText={this.getFieldError('customerName')}
            />
          </Grid>

          <Grid item xs={6}>
            <Field
              component={TextField}
              name="customerMobile"
              label="顾客手机"
              value={values.customerMobile}
              onBlur={this.activateValidation('customerMobile')}
              onChange={e => {
                var { value } = e.target
                // allow only numbers and max 11
                if (/^1\d{0,10}$/.test(value) || !value) {
                  this.setState(
                    { values: { ...values, customerMobile: value } },
                    this.props.handleValidation('customerMobile')
                  )
                }
              }}
              error={!!this.getFieldError('customerMobile')}
              helperText={this.getFieldError('customerMobile')}
            />
          </Grid>
        </Grid>

        <Field
          component={RegionPicker}
          name="customerRegionCode"
          label="所在地区"
          value={values.customerRegionCode}
          preSelect={310100}
          onChange={this.handleChange('customerRegionCode')}
          error={!!this.getFieldError('customerRegionCode')}
          helperText={this.getFieldError('customerRegionCode')}
        />

        <Field
          component={TextField}
          name="customerStreet"
          label="详细地址"
          value={values.customerStreet}
          onChange={this.handleChange('customerStreet')}
          error={!!this.getFieldError('customerStreet')}
          helperText={this.getFieldError('customerStreet')}
        />

        <Grid container justify="center" spacing={24}>
          <Grid item xs={6}>
            <Field
              component={DatePicker}
              label="预约测量日期"
              disabled={!values.isMeasurementRequested}
              autoOk
              name="scheduledMeasurementDate"
              disablePast
              maxDate={values.scheduledInstallationDate || undefined}
              leftArrowIcon={<ArrowLeftIcon />}
              rightArrowIcon={<ArrowRightIcon />}
              value={values.scheduledMeasurementDate}
              labelFunc={date => dateFormat(date, 'YYYY/MM/DD')}
              onChange={this.handleChange(
                'scheduledMeasurementDate',
                'datepicker'
              )}
              error={!!this.getFieldError('scheduledMeasurementDate')}
              helperText={this.getFieldError('scheduledMeasurementDate')}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.isMeasurementRequested}
                  onChange={this.handleChangeMeasurementRequested}
                  value="isMeasurementRequested"
                  icon={<CloseBox color="secondary" />}
                  color={
                    values.isMeasurementRequested ? 'primary' : 'secondary'
                  }
                />
              }
              classes={{
                label: values.isMeasurementRequested
                  ? null
                  : classes.measurementNotRequested
              }}
              label={values.isMeasurementRequested ? '需要测量' : '不需要测量!'}
            />
          </Grid>

          <Grid item xs={6}>
            <Field
              component={DatePicker}
              name="scheduledInstallationDate"
              label="预约安装日期"
              required={false}
              autoOk
              clearable
              leftArrowIcon={<ArrowLeftIcon />}
              rightArrowIcon={<ArrowRightIcon />}
              value={values.scheduledInstallationDate}
              minDate={values.scheduledMeasurementDate || new Date()}
              labelFunc={date => dateFormat(date, 'YYYY/MM/DD')}
              onChange={this.handleChange(
                'scheduledInstallationDate',
                'datepicker'
              )}
              error={!!this.getFieldError('scheduledInstallationDate')}
              helperText={this.getFieldError('scheduledInstallationDate')}
            />
          </Grid>
        </Grid>

        <Field
          component={FileUploader}
          name="orderFile"
          label="原始订单"
          compressImage={false}
          error={!!this.getFieldError('orderFile')}
          helperText={this.getFieldError('orderFile')}
          onChange={this.handleChange('orderFile')}
          value={values.orderFile}
        />

        <div className={classes.buttonRow}>
          <Button
            variant="raised"
            color="primary"
            className={classes.submitButton}
            onClick={this.handleSubmit}
          >
            <PaperPlaneIcon className={classes.buttonIcon} />提交订单
          </Button>
        </div>
      </Paper>
    )
  }
}

// validation should come after withStyles
export default compose(withStyles(styles), validation(strategy))(StartForm)
