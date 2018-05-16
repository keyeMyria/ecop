import React from 'react'
import validation from 'react-validation-mixin'
import strategy from 'react-validatorjs-strategy'
import compose from 'recompose/compose'
import PropTypes from 'prop-types'

import Dialog from '@material-ui/core/Dialog'
import Toolbar from '@material-ui/core/Toolbar'
import AppBar from '@material-ui/core/AppBar'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import red from '@material-ui/core/colors/red'

import { jsonrpc } from 'homemaster-jslib'
import ValidatedForm from 'homemaster-jslib/ValidatedForm'

const styles = {
  paperWidthSm: {
    maxWidth: 400
  }
}

class LoginDialog extends ValidatedForm {
  state = {
    errMsg: '',
    values: {
      login: '',
      password: ''
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

  handleLogin = () => {
    const { login, password } = this.state.values
    this.props.validate(error => {
      if (error) {
        this.setState({ errMsg: '请正确输入用户名及密码' })
      } else {
        jsonrpc({
          method: 'auth.login',
          params: [login, password, 'worktop'],
          success: this.props.onLoginSuccess
        })
      }
    })
  }

  render = () => {
    return (
      <Dialog open classes={{ paperWidthSm: this.props.classes.paperWidthSm }}>
        <AppBar style={{ position: 'relative' }}>
          <Toolbar>
            <Typography variant="title" color="inherit">
              请登录
            </Typography>
          </Toolbar>
        </AppBar>
        <div
          style={{ overflow: 'auto', padding: 16 }}
          onKeyDown={e => e.keyCode === 13 && this.handleLogin()}
        >
          <div style={{ color: red[500] }}>{this.state.errMsg}</div>
          <TextField
            name="login"
            fullWidth
            margin="normal"
            placeholder="用户名"
            label="用户名"
            autoFocus
            onChange={this.handleChange}
            error={!!this.getFieldError('login')}
            helperText={this.getFieldError('login')}
          />
          <TextField
            name="password"
            type="password"
            fullWidth
            margin="normal"
            placeholder="登录密码"
            label="登录密码"
            onChange={this.handleChange}
            error={!!this.getFieldError('password')}
            helperText={this.getFieldError('password')}
          />
          <Button
            variant="raised"
            color="primary"
            style={{ marginTop: 12, width: '100%' }}
            onClick={this.handleLogin}
          >
            <ExitToAppIcon />&nbsp; 登 &nbsp; 录
          </Button>
        </div>
      </Dialog>
    )
  }
}

LoginDialog.propTypes = {
  /**
   * Function to invoke after successful login
   */
  onLoginSuccess: PropTypes.func.isRequired
}

// validation should come after withStyles
export default compose(withStyles(styles), validation(strategy))(LoginDialog)
