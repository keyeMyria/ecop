import React from 'react'
import validation from 'react-validation-mixin'
import compose from 'recompose/compose'
import update from 'immutability-helper'
import isEmpty from 'lodash/isEmpty'

import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import DatePicker from 'material-ui-pickers/DatePicker'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import InputLabel from '@material-ui/core/InputLabel'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import ArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft'
import ArrowRightIcon from '@material-ui/icons/KeyboardArrowRight'
import DeleteIcon from '@material-ui/icons/Delete'

import { jsonrpc, message } from 'homemaster-jslib'
import RegionPicker from 'homemaster-jslib/region/RegionPicker'
import PaperPlaneIcon from 'homemaster-jslib/svg-icons/PaperPlane'
import CloseBox from 'homemaster-jslib/svg-icons/CloseBox'

import { strategy, ValidatedForm, Field } from 'form'
import FileUploader from 'widget/FileUploader'
import OrderItem from 'widget/OrderItem'
import dateFormat from 'utils/date-fns'
import { isValidOrderId } from 'utils/validators'

const styles = theme => ({
  root: {
    maxWidth: 700,
    padding: 16
  },
  orderId: theme.custom.orderId,
  itemRow: {
    marginTop: theme.spacing.unit,
    display: 'flex',
    alignItems: 'center'
  },
  itemRowButton: {
    flexShrink: 0,
    marginLeft: theme.spacing.unit
  },
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
    factoryNumber: '',
    isMeasurementRequested: true,
    scheduledMeasurementDate: null,
    scheduledInstallationDate: null,
    orderFile: [],
    orderItems: []
  }

  state = { values: this.defaultValues }

  validatorTypes = strategy.createInactiveSchema(
    {
      externalOrderId: 'IKEAOrderId',
      factoryNumber: 'required',
      storeId: 'required|size:3|in:856,885,247',
      customerName: 'required|min:2',
      customerMobile: 'required|mobile',
      customerRegionCode: 'required',
      customerStreet: 'required',
      scheduledMeasurementDate: [
        { required_if: ['isMeasurementRequested', true] }
      ],
      orderFile: 'required'
    },
    {
      'required.storeId': '商场号必须输入',
      'required.factoryNumber': '工厂编号必须输入',
      'in.storeId': '商场号错误',
      'size.storeId': '宜家商场号长度为3位',
      'required.customerName': '顾客名称必须输入',
      'min.customerName': '顾客名称长度至少为2个字符',
      'required.customerMobile': '顾客手机必须输入',
      'required.customerStreet': '详细地址必须输入',
      'required.customerRegionCode': '所在地区必须输入',
      'required_if.scheduledMeasurementDate': '预约测量日期必须输入',
      'required.orderFile': '原始订单必须上传'
    }
  )

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
    const { values } = this.state
    const itemIds = []

    this.props.validate(error => {
      if (!error) {
        if (isEmpty(values.orderItems)) {
          message.error('订单项目必须输入')
          return
        }

        for (var i = 0; i < values.orderItems.length; i++) {
          const oi = values.orderItems[i]
          if (oi === null) {
            message.error('货号数量输入不正确')
            return
          }
          if (itemIds.indexOf(oi.itemId) !== -1) {
            message.error('不允许出现重复货号')
            return
          } else {
            itemIds.push(oi.itemId)
          }
        }

        jsonrpc({
          method: 'bpmn.process.start',
          params: [values]
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
    const ois = [...values.orderItems]

    if (ois.length === 0 || ois.slice(-1)[0]) {
      ois.push(undefined)
    }

    return (
      <Paper className={classes.root}>
        <Grid container justify="space-between" spacing={24}>
          <Grid item xs={5}>
            <Field
              component={TextField}
              name="externalOrderId"
              label="订单号"
              required={false}
              autoFocus
              form={this}
              InputProps={{ classes: { input: classes.orderId } }}
              onBlur={this.activateValidation('externalOrderId')}
              onChange={e => {
                var { value } = e.target
                if (!value || isValidOrderId(value, true)) {
                  this.setState(
                    {
                      values: update(values, {
                        externalOrderId: {
                          $set: value.toUpperCase()
                        }
                      })
                    },
                    this.props.handleValidation('externalOrderId')
                  )
                }
              }}
            />
          </Grid>

          <Grid item xs={5}>
            <Field
              component={TextField}
              name="factoryNumber"
              label="工厂编号"
              form={this}
            />
          </Grid>

          <Grid item xs={2}>
            <Field
              component={TextField}
              name="storeId"
              label="宜家商场号"
              form={this}
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
            />
          </Grid>
        </Grid>

        <Grid container justify="center" spacing={24}>
          <Grid item xs={6}>
            <Field
              component={TextField}
              name="customerName"
              label="顾客名称"
              form={this}
            />
          </Grid>

          <Grid item xs={6}>
            <Field
              component={TextField}
              name="customerMobile"
              label="顾客手机"
              form={this}
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
            />
          </Grid>
        </Grid>

        <Field
          component={RegionPicker}
          name="customerRegionCode"
          label="所在地区"
          form={this}
          preSelect={310100}
        />

        <Field
          component={TextField}
          name="customerStreet"
          label="详细地址"
          form={this}
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
              labelFunc={date => dateFormat(date, 'YYYY/MM/DD')}
              form={this}
              onChange={this.handleChange(
                'scheduledMeasurementDate',
                'datepicker'
              )}
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
              minDate={values.scheduledMeasurementDate || new Date()}
              labelFunc={date => dateFormat(date, 'YYYY/MM/DD')}
              form={this}
              onChange={this.handleChange(
                'scheduledInstallationDate',
                'datepicker'
              )}
            />
          </Grid>
        </Grid>

        <InputLabel shrink={true} required={true}>
          订单项目
        </InputLabel>
        {ois.map((oi, idx) => (
          <div key={idx} className={classes.itemRow}>
            <OrderItem
              value={oi}
              onChange={value => {
                this.setState(
                  update(this.state, {
                    values: {
                      orderItems:
                        value === undefined
                          ? {
                              $splice: [[idx, 1]]
                            }
                          : {
                              [idx]: { $set: value }
                            }
                    }
                  })
                )
              }}
            />
            <Button
              className={classes.itemRowButton}
              variant="fab"
              mini
              color="primary"
              disabled={oi === undefined}
              onClick={() => {
                this.setState(
                  update(this.state, {
                    values: {
                      orderItems: {
                        $splice: [[idx, 1]]
                      }
                    }
                  })
                )
              }}
            >
              <DeleteIcon />
            </Button>
          </div>
        ))}

        <Field
          component={FileUploader}
          name="orderFile"
          label="原始订单"
          compressImage={false}
          form={this}
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
