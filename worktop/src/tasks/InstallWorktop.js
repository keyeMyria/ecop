import React, { Fragment } from 'react'
import validation from 'react-validation-mixin'
import format from 'date-fns/format'

import TextField from 'material-ui/TextField'

import { strategy, ValidatedForm, Field } from 'form'
import FileUploader from 'widget/FileUploader'

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
    const { variables } = this.props

    return (
      <Fragment>
        <Field
          label="确认安装日期"
          component={TextField}
          disabled
          value={format(variables.confirmedInstallationDate, 'YYYY/MM/DD')}
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

export default validation(strategy)(InstallWorktop)
