/* global App */
import React, { Component, Fragment } from 'react'
import compose from 'recompose/compose'

import { withStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import PrintIcon from '@material-ui/icons/Print'

import { Field } from 'form'
import FileUploader from 'widget/FileUploader'
import dateFormat from 'utils/date-fns'

const styles = theme => ({
  submitButton: theme.custom.submitButton,
  buttonRow: theme.custom.buttonRow,
  buttonIcon: theme.custom.buttonIcon
})

class InstallWorktop extends Component {
  state = { installationFile: null, errorText: '' }

  submitForm = () => {
    if (this.validate()) {
      this.props.submitForm({ installationFile: this.state.installationFile })
    }
  }

  getErrorText = () => this.state.errorText

  validate = () => {
    const value = this.state.installationFile

    if (!value || value.length === 0) {
      this.setState({ errorText: '安装文件必须上传' })
      return false
    } else if (
      this.props.variables.isInstallationRequested &&
      value.length < 2
    ) {
      this.setState({
        errorText: '必须上传顾客签收以及现场照片至少2个文件'
      })
      return false
    }

    this.setState({
      errorText: ''
    })
    return true
  }

  handleChangeInstallationFile = e => {
    this.setState(
      {
        installationFile: e.target.value
      },
      this.validate
    )
  }

  render = () => {
    const { classes, task, variables } = this.props
    const taskName = variables.isInstallationRequested ? '安装' : '送货'

    return (
      <Fragment>
        <Field
          label={`确认${taskName}日期`}
          component={TextField}
          disabled
          value={dateFormat(variables.confirmedInstallationDate, 'YYYY/MM/DD')}
        />
        <FileUploader
          label="生产图纸"
          fullWidth
          margin="normal"
          allowUpload={false}
          allowDelete={false}
          InputLabelProps={{
            shrink: true
          }}
          value={variables.productionDrawing}
        />
        <div className={classes.buttonRow}>
          <Button
            variant="raised"
            color="primary"
            className={classes.submitButton}
            target="_blank"
            href={`/ikea/forms/${task.processInstanceId}/${
              variables.isInstallationRequested
                ? 'install_form'
                : 'delivery_note'
            }.pdf?token=${App.csrfToken}`}
          >
            <PrintIcon className={classes.buttonIcon} />打印签收单
          </Button>
        </div>
        <FileUploader
          label="安装文件"
          required
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true
          }}
          value={this.state.installationFile}
          onChange={this.handleChangeInstallationFile}
          error={!!this.getErrorText()}
          helperText={this.getErrorText()}
        />
      </Fragment>
    )
  }
}

export default compose(withStyles(styles))(InstallWorktop)
