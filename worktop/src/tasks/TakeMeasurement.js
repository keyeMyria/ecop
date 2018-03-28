import React from 'react'
import validation from 'react-validation-mixin'

import { strategy, ValidatedForm, Field } from 'form'
import FileUploader from 'widget/FileUploader'

class TakeMeasurement extends ValidatedForm {
  state = {
    values: {
      measurementFile: []
    }
  }

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

    return (
      <Field
        component={FileUploader}
        name="measurementFile"
        label="测量文件"
        error={!!this.getFieldError('measurementFile')}
        helperText={this.getFieldError('measurementFile')}
        onChange={this.handleChange('measurementFile')}
        value={values.measurementFile}
      />
    )
  }
}

export default validation(strategy)(TakeMeasurement)
