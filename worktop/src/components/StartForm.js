import React from 'react'
import validation from 'react-validation-mixin'
import compose from 'recompose/compose'

import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import { DatePicker } from 'material-ui-pickers'
import Grid from 'material-ui/Grid'
import Paper from 'material-ui/Paper'

import { jsonrpc, RegionPicker } from 'homemaster-jslib'
import PaperPlaneIcon from 'homemaster-jslib/svg-icons/PaperPlane'

import { strategy, ValidatedForm } from 'form'

const styles = {
  root: {
    maxWidth: 700,
    padding: 16,
    margin: 16
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
  }
}

class StartForm extends ValidatedForm {
  state = {
    values: {
      orderId: '',
      customerName: '',
      customerMobile: '',
      regionCode: null,
      street: '',
      measureDate: null,
      installDate: null
    }
  }

  // TODO: check unique orderId
  validatorTypes = strategy.createInactiveSchema(
    {
      orderId: 'required|size:9',
      storeId: 'required',
      customerName: 'required',
      customerMobile: 'required|mobile',
      measureDate: 'required',
      installDate: 'required',
      regionCode: 'required',
      street: 'required'
    },
    {
      'required.orderId': '宜家订单号必须输入',
      'size.orderId': '宜家订单号长度为9',
      'required.customerName': '顾客名称必须输入',
      'required.customerMobile': '顾客手机必须输入',
      'required.measureDate': '测量日期必须输入',
      'required.installDate': '安装日期必须输入'
    }
  )

  handleSubmit = () => {
    this.props.validate(error => {
      if (!error) {
        console.log(this.state.values)
      }
    })
  }

  handleChangeOrderId = e => {
    const { value, name: field } = e.target
    this.setState(
      { values: { ...this.state.values, [field]: value.trim() } },
      this.props.handleValidation(field)
    )
  }

  render = () => {
    const { classes } = this.props
    const { values } = this.state

    return (
      <Paper className={classes.root}>
        <Grid container justify="space-between">
          <Grid item xs={4}>
            <TextField
              name="orderId"
              required
              fullWidth
              margin="normal"
              label="宜家订单号"
              InputLabelProps={{
                shrink: true
              }}
              value={values.orderId}
              onBlur={this.activateValidation}
              onChange={e => {
                var { value } = e.target
                if (/^\d{0,9}$/.test(value) || !value) {
                  this.setState(
                    { values: { ...values, orderId: value } },
                    this.props.handleValidation('orderId')
                  )
                }
              }}
              error={!!this.getFieldError('orderId')}
              helperText={this.getFieldError('orderId')}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              name="storeId"
              required
              fullWidth
              margin="normal"
              label="宜家商场号"
              InputLabelProps={{
                shrink: true
              }}
              onChange={this.handleChange}
              error={!!this.getFieldError('storeId')}
              helperText={this.getFieldError('storeId')}
            />
          </Grid>
        </Grid>

        <Grid container justify="center" spacing={24}>
          <Grid item xs={6}>
            <TextField
              name="customerName"
              required
              margin="normal"
              fullWidth
              label="顾客姓名"
              InputLabelProps={{
                shrink: true
              }}
              onChange={this.handleChange}
              error={!!this.getFieldError('customerName')}
              helperText={this.getFieldError('customerName')}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              name="customerMobile"
              required
              margin="normal"
              fullWidth
              label="顾客手机"
              value={values.customerMobile}
              InputLabelProps={{
                shrink: true
              }}
              onBlur={this.activateValidation}
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
            <DatePicker
              label="测量日期"
              keyboard
              required
              fullWidth
              name="measureDate"
              InputLabelProps={{
                shrink: true
              }}
              value={values.measureDate}
              onChange={date =>
                this.handleChange({
                  target: {
                    value: date,
                    name: 'measureDate'
                  }
                })
              }
              error={!!this.getFieldError('measureDate')}
              helperText={this.getFieldError('measureDate')}
            />
          </Grid>

          <Grid item xs={6}>
            <DatePicker
              label="安装日期"
              required
              fullWidth
              name="installDate"
              InputLabelProps={{
                shrink: true
              }}
              value={values.installDate}
              onChange={date =>
                this.handleChange({
                  target: {
                    value: date,
                    name: 'installDate'
                  }
                })
              }
              error={!!this.getFieldError('installDate')}
              helperText={this.getFieldError('installDate')}
            />
          </Grid>
        </Grid>

        <RegionPicker
          name="regionCode"
          required
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true
          }}
          label="所在地区"
          value={values.regionCode}
          onBlur={this.activateValidation}
          onChange={this.handleChange}
          error={!!this.getFieldError('regionCode')}
          helperText={this.getFieldError('regionCode')}
        />

        <TextField
          name="street"
          required
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true
          }}
          label="详细地址"
          onBlur={this.activateValidation}
          onChange={this.handleChange}
          error={!!this.getFieldError('street')}
          helperText={this.getFieldError('street')}
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
