/* global App */
import React from 'react'
import validation from 'react-validation-mixin'
import compose from 'recompose/compose'
import format from 'date-fns/format'
import addDays from 'date-fns/addDays'

import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import DatePicker from 'material-ui-pickers/DatePicker'
import Grid from 'material-ui/Grid'
import Paper from 'material-ui/Paper'
import { FormGroup, FormControlLabel } from 'material-ui/Form'
import Checkbox from 'material-ui/Checkbox'
import ArrowLeftIcon from 'material-ui-icons/KeyboardArrowLeft'
import ArrowRightIcon from 'material-ui-icons/KeyboardArrowRight'

import { jsonrpc, message } from 'homemaster-jslib'
import RegionPicker from 'homemaster-jslib/region/RegionPicker'
import PaperPlaneIcon from 'homemaster-jslib/svg-icons/PaperPlane'

import { strategy, ValidatedForm, Field } from 'form'
import FileUploader from 'widget/FileUploader'

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
  },
  checkBoxContainer: {
    flexBasis: '50%'
  }
}

class StartForm extends ValidatedForm {
  defaultValues = {
    externalOrderId: '',
    storeId: '',
    customerName: '',
    customerMobile: '',
    regionCode: null,
    street: '',
    scheduledMeasureDate: null,
    scheduledInstallDate: null,
    installFaucet: false,
    installSink: false,
    files: []
  }

  validatorTypes = strategy.createInactiveSchema(
    {
      externalOrderId: 'required|size:9',
      storeId: 'required|size:3|in:856,885,247',
      customerName: 'required',
      customerMobile: 'required|mobile',
      scheduledMeasureDate: 'required',
      scheduledInstallDate: 'required',
      regionCode: 'required',
      street: 'required',
      files: 'required'
    },
    {
      'required.externalOrderId': '宜家订单号必须输入',
      'size.externalOrderId': '宜家订单号长度为9位',
      'required.storeId': '宜家商场号必须输入',
      'in.storeId': '商场号错误',
      'size.storeId': '宜家商场号长度为3位',
      'required.customerName': '顾客名称必须输入',
      'required.customerMobile': '顾客手机必须输入',
      'required.scheduledMeasureDate': '测量日期必须输入',
      'required.scheduledInstallDate': '安装日期必须输入',
      'required.street': '详细地址必须输入',
      'required.regionCode': '所在地区必须输入',
      'required.files': '原始图纸必须上传'
    }
  )

  constructor(props) {
    super(props)
    this.state = { values: this.defaultValues }
  }

  resetForm = () => {
    this.setState({ values: this.defaultValues })
  }

  handleSubmit = () => {
    this.props.validate(error => {
      if (!error) {
        jsonrpc({
          method: 'bpmn.process.start',
          params: [App.processKey, this.state.values]
        }).then(() => {
          message.success('订单提交成功')
          // this.resetForm()
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
              label="宜家订单号"
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
              label="顾客姓名"
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

        <Grid container justify="center" spacing={24}>
          <Grid item xs={6}>
            <Field
              component={DatePicker}
              label="测量日期"
              autoOk
              name="scheduledMeasureDate"
              disablePast
              maxDate={
                values.scheduledInstallDate
                  ? addDays(values.scheduledInstallDate, -7)
                  : undefined
              }
              leftArrowIcon={<ArrowLeftIcon />}
              rightArrowIcon={<ArrowRightIcon />}
              value={values.scheduledMeasureDate}
              labelFunc={date => (date ? format(date, 'YYYY/MM/DD') : '')}
              onChange={this.handleChange('scheduledMeasureDate', 'datepicker')}
              error={!!this.getFieldError('scheduledMeasureDate')}
              helperText={this.getFieldError('scheduledMeasureDate')}
            />
          </Grid>

          <Grid item xs={6}>
            <Field
              component={DatePicker}
              name="scheduledInstallDate"
              label="安装日期"
              autoOk
              leftArrowIcon={<ArrowLeftIcon />}
              rightArrowIcon={<ArrowRightIcon />}
              value={values.scheduledInstallDate}
              minDate={addDays(values.scheduledMeasureDate || new Date(), 7)}
              labelFunc={date => (date ? format(date, 'YYYY/MM/DD') : '')}
              onChange={this.handleChange('scheduledInstallDate', 'datepicker')}
              error={!!this.getFieldError('scheduledInstallDate')}
              helperText={this.getFieldError('scheduledInstallDate')}
            />
          </Grid>
        </Grid>

        <Field
          component={RegionPicker}
          name="regionCode"
          label="所在地区"
          value={values.regionCode}
          preSelect={310100}
          onChange={this.handleChange('regionCode')}
          error={!!this.getFieldError('regionCode')}
          helperText={this.getFieldError('regionCode')}
        />

        <Field
          component={TextField}
          name="street"
          label="详细地址"
          value={values.street}
          onChange={this.handleChange('street')}
          error={!!this.getFieldError('street')}
          helperText={this.getFieldError('street')}
        />

        <FormGroup row>
          <div className={classes.checkBoxContainer}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.installFaucet}
                  onChange={this.handleChange('installFaucet', 'checkbox')}
                />
              }
              label={(values.installFaucet ? '' : '不') + '需要安装水槽'}
            />
          </div>
          <div className={classes.checkBoxContainer}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.installSink}
                  onChange={this.handleChange('installSink', 'checkbox')}
                  color="primary"
                />
              }
              label={(values.installSink ? '' : '不') + '需要安装龙头'}
            />
          </div>
        </FormGroup>

        <Field
          component={FileUploader}
          label="原始图纸"
          imageCompressOptions={{ quality: 0.9 }}
          error={!!this.getFieldError('files')}
          helperText={this.getFieldError('files')}
          onChange={this.handleChange('files')}
          value={values.files}
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
