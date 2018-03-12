import React, { Component } from 'react'
import validatorjs from 'validatorjs'
import { Form } from 'mobx-react-form'
import { observer } from 'mobx-react'

import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import { red } from 'material-ui/colors'
import { DatePicker } from 'material-ui-pickers'
import { Typography } from 'material-ui'

import { jsonrpc } from 'homemaster-jslib'
import PaperPlaneIcon from 'icons/PaperPlane'

const styles = {
  root: {
    maxWidth: 700,
    padding: 16
  },
  submitButton: {
    marginTop: 12,
    width: '50%'
  },
  buttonRow: {
    textAlign: 'center'
  },
  sendIcon: {
    transform: 'rotate(-30deg)'
  }
}

class FormMobx extends Form {
  plugins = () => ({
    dvr: validatorjs
  })

  setup = () => ({
    fields: [
      {
        name: 'customerName',
        rules: 'required'
      },
      {
        name: 'customerPhone',
        rules: 'required'
      },
      {
        name: 'measureDate',
        rules: 'required'
      }
    ]
  })
}

const form = new FormMobx()

let StartForm = observer(({ form }) => {
  const { classes } = this.props

  return (
    <form className={classes.root}>
      <div style={{ color: red[500] }}>{this.state.errMsg}</div>
      <TextField
        name="login"
        fullWidth
        margin="normal"
        label="顾客姓名"
        onChange={this.handleChange}
        error={!!this.getFieldError('login')}
        helperText={this.getFieldError('login')}
      />

      <TextField
        name="password"
        fullWidth
        margin="normal"
        label="顾客电话"
        onChange={this.handleChange}
        error={!!this.getFieldError('customerPhone')}
        helperText={this.getFieldError('customerPhone')}
      />

      <div className="picker">
        <Typography variant="headline" align="center" gutterBottom>
          测量日期
        </Typography>
        <DatePicker
          name="measureDate"
          value={this.state.measureDate}
          onChange={this.handleDateChange}
        />
      </div>

      <div className={classes.buttonRow}>
        <Button
          variant="raised"
          color="primary"
          className={classes.submitButton}
          onClick={this.handleSubmit}
        >
          <PaperPlaneIcon className={classes.sendIcon} />&nbsp;提交订单
        </Button>
      </div>
    </form>
  )
})

// validation should come after withStyles
export default withStyles(styles)(StartForm)
