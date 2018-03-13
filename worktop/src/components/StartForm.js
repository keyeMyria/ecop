import React from 'react'
import validation from 'react-validation-mixin'
import strategy from 'react-validatorjs-strategy'
import compose from 'recompose/compose'

import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import { DatePicker } from 'material-ui-pickers'
import Grid from 'material-ui/Grid'
import Paper from 'material-ui/Paper'

import { ValidatedForm, jsonrpc } from 'homemaster-jslib'
import { RegionPicker } from 'homemaster-jslib/region'
import PaperPlaneIcon from 'homemaster-jslib/svg-icons/PaperPlane'

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
      orderId: null,
      customerName: '',
      customerPhone: '',
      regionCode: null,
      street: '',
      measureDate: null,
      installDate: null
    }
  }

  // TODO: check unique orderId
  validatorTypes = strategy.createSchema(
    {
      orderId: 'required',
      storeId: 'required',
      customerName: 'required',
      customerPhone: 'required',
      measureDate: 'required',
      installDate: 'required',
      regionCode: 'required',
      street: 'required'
    },
    {
      'required.customerName': '顾客名称必须输入',
      'required.customerPhone': '顾客电话必须输入',
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
              onChange={this.handleChange}
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
              name="customerPhone"
              required
              margin="normal"
              fullWidth
              label="顾客电话"
              InputLabelProps={{
                shrink: true
              }}
              onChange={this.handleChange}
              error={!!this.getFieldError('customerPhone')}
              helperText={this.getFieldError('customerPhone')}
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
