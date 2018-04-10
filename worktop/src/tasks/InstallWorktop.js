/* global App */
import React, { Fragment } from 'react'
import validation from 'react-validation-mixin'
import compose from 'recompose/compose'

import { withStyles } from 'material-ui/styles'
import TextField from 'material-ui/TextField'
import Button from 'material-ui/Button'
import PrintIcon from '@material-ui/icons/Print'

import { strategy, ValidatedForm, Field } from 'form'
import FileUploader from 'widget/FileUploader'
import dateFormat from 'utils/date-fns'

const styles = theme => ({
  submitButton: theme.custom.submitButton,
  buttonRow: theme.custom.buttonRow,
  buttonIcon: theme.custom.buttonIcon
})

class InstallWorktop extends ValidatedForm {
  state = { values: {} }

  validatorTypes = strategy.createInactiveSchema(
    {
      installationFile: 'required|min:2'
    },
    {
      'required.installationFile': '安装文件必须上传',
      'min.installationFile': '必须上传顾客签收以及现场照片至少2个文件'
    }
  )

  submitForm = () => {
    this.props.validate(error => {
      if (!error) {
        this.props.submitForm(this.state.values)
      }
    })
  }

  render = () => {
    const { values } = this.state
    const { classes, task, variables } = this.props

    return (
      <Fragment>
        <Field
          label="确认安装日期"
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
            href={`/ikea/forms/${
              task.processInstanceId
            }/install_form.pdf?token=${App.csrfToken}`}
          >
            <PrintIcon className={classes.buttonIcon} />打印签收单
          </Button>
        </div>

        <Field
          component={FileUploader}
          name="installationFile"
          label="安装文件"
          error={!!this.getFieldError('installationFile')}
          helperText={this.getFieldError('installationFile')}
          onChange={this.handleChange('installationFile')}
          value={values.installationFile}
        />
      </Fragment>
    )
  }
}

export default compose(withStyles(styles), validation(strategy))(InstallWorktop)
