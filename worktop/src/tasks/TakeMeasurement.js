import React, { Fragment } from 'react'
import validation from 'react-validation-mixin'
import format from 'date-fns/format'

import TextField from 'material-ui/TextField'

import { strategy, ValidatedForm, Field } from 'form'
import FileUploader from 'widget/FileUploader'

class TakeMeasurement extends ValidatedForm {
  state = { values: {} }

  validatorTypes = strategy.createInactiveSchema(
    {
      measurementFile: 'required'
    },
    {
      'required.measurementFile': '测量文件必须上传'
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
          label="确认测量日期"
          component={TextField}
          disabled
          value={format(variables.scheduledMeasurementDate, 'YYYY/MM/DD')}
        />

        <FileUploader
          label="订单文件"
          fullWidth
          margin="normal"
          allowUpload={false}
          allowDelete={false}
          InputLabelProps={{
            shrink: true
          }}
          value={variables.orderFile}
        />

        <Field
          component={FileUploader}
          name="measurementFile"
          label="测量文件"
          error={!!this.getFieldError('measurementFile')}
          helperText={this.getFieldError('measurementFile')}
          onChange={this.handleChange('measurementFile')}
          value={values.measurementFile}
        />
      </Fragment>
    )
  }
}

export default validation(strategy)(TakeMeasurement)
