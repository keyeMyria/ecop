import React from 'react'
import validation from 'react-validation-mixin'
import strategy from 'react-validatorjs-strategy'
import compose from 'recompose/compose'

import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import { red } from 'material-ui/colors'
import { DatePicker } from 'material-ui-pickers'
import { Typography } from 'material-ui'

import { ValidatedForm, jsonrpc } from 'homemaster-jslib'
import PaperPlaneIcon from 'homemaster-jslib/svg-icons/PaperPlane'

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
  buttonIcon: {
    marginRight: 10
  }
}

class StartForm extends ValidatedForm {
  state = {
    errMsg: '',
    values: {
      customerName: '',
      customerPhone: '',
      measureDate: null
    }
  }

  validatorTypes = strategy.createSchema(
    {
      login: 'required',
      password: 'required|min:6'
    },
    {
      'required.login': '用户名必须输入',
      'required.password': '密码必须输入',
      'min.password': '密码长度至少为6个字符'
    }
  )

  handleDateChange = date => {
    this.setState({ measureDate: date })
  }

  handleSubmit = () => {
    this.props.validate(error => {
      if (error) {
        this.setState({ errMsg: '请正确输入用户名及密码' })
      } else {
        jsonrpc({
          method: 'auth.login',
          params: this.state.values,
          success: response => {
            this.setState({ open: false })
          }
        })
      }
    })
  }

  render = () => {
    const { classes } = this.props

    return (
      <div className={classes.root}>
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
            <PaperPlaneIcon className={classes.buttonIcon} />提交订单
          </Button>
        </div>
      </div>
    )
  }
}

// validation should come after withStyles
export default compose(withStyles(styles), validation(strategy))(StartForm)
