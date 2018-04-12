import React, { Fragment } from 'react'
import validation from 'react-validation-mixin'

import { FormControl } from 'material-ui/Form'
import Typography from 'material-ui/Typography'

import { strategy, ValidatedForm, Field } from 'form'
import FileUploader from 'widget/FileUploader'

/**
 * This form is shared by the task MakeDrawing and UpdateDrawing, as they are
 * the same
 */
class MakeDrawing extends ValidatedForm {
  state = { values: {} }

  validatorTypes = strategy.createSchema(
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
          label="原始订单"
          fullWidth
          margin="normal"
          allowUpload={false}
          allowDelete={false}
          initiallyExpanded={false}
          InputLabelProps={{
            shrink: true
          }}
          value={variables.orderFile}
        />

        {variables.isMeasurementRequested ? (
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
        ) : (
          <Typography variant="headline" color="error">
            该订单为无测量订单。
          </Typography>
        )}

        {variables.productionDrawingConfirmed === false && (
          <FormControl>
            <Typography variant="display1" color="error">
              该图纸审核未通过，被拒绝原因:
            </Typography>
            <Typography variant="headline" color="error">
              {variables.reasonDrawingRejected}
            </Typography>
          </FormControl>
        )}

        <Field
          component={FileUploader}
          name="productionDrawing"
          label="生产图纸"
          error={!!this.getFieldError('productionDrawing')}
          helperText={this.getFieldError('productionDrawing')}
          onChange={this.handleChange('productionDrawing')}
          value={values.productionDrawing || variables.productionDrawing}
        />
      </Fragment>
    )
  }
}

export default validation(strategy)(MakeDrawing)
