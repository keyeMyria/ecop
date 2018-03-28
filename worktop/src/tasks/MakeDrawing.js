import React, { Fragment } from 'react'
import validation from 'react-validation-mixin'

import { strategy, ValidatedForm, Field } from 'form'
import FileUploader from 'widget/FileUploader'

class MakeDrawing extends ValidatedForm {
  state = {
    values: {
      productionDrawing: []
    }
  }

  validatorTypes = strategy.createInactiveSchema(
    {
      productionDrawing: 'required'
    },
    {
      'required.productionDrawing': '生产图纸必须上传'
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

        <FileUploader
          label="测量文件"
          fullWidth
          margin="normal"
          allowUpload={false}
          allowDelete={false}
          InputLabelProps={{
            shrink: true
          }}
          value={variables.measurementFile}
        />

        <Field
          component={FileUploader}
          name="productionDrawing"
          label="生产图纸"
          error={!!this.getFieldError('productionDrawing')}
          helperText={this.getFieldError('productionDrawing')}
          onChange={this.handleChange('productionDrawing')}
          value={values.productionDrawing}
        />
      </Fragment>
    )
  }
}

export default validation(strategy)(MakeDrawing)
