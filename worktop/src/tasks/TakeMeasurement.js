/* global App */
import React, { Fragment } from 'react'
import compose from 'recompose/compose'
import validation from 'react-validation-mixin'

import { withStyles } from 'material-ui/styles'
import TextField from 'material-ui/TextField'
import Button from 'material-ui/Button'
import PrintIcon from 'material-ui-icons/Print'

import { strategy, ValidatedForm, Field } from 'form'
import FileUploader from 'widget/FileUploader'
import dateFormat from 'utils/date-fns'

const styles = theme => ({
  submitButton: theme.custom.submitButton,
  buttonRow: theme.custom.buttonRow,
  buttonIcon: theme.custom.buttonIcon
})

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
    const { classes, task, variables } = this.props

    return (
      <Fragment>
        <Field
          label="确认测量日期"
          component={TextField}
          disabled
          value={dateFormat(variables.scheduledMeasurementDate, 'YYYY/MM/DD')}
        />

        <FileUploader
          label="原始订单"
          fullWidth
          margin="normal"
          allowUpload={false}
          allowDelete={false}
          InputLabelProps={{
            shrink: true
          }}
          value={variables.orderFile}
        />

        <div className={classes.buttonRow}>
          <Button
            variant="raised"
            color="primary"
            className={classes.submitButton}
            target="_blank"
            href={`/ikea/forms/${
              task.processInstanceId
            }/measure_form.pdf?token=${App.csrfToken}`}
          >
            <PrintIcon className={classes.buttonIcon} />打印测量单
          </Button>
        </div>

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

export default compose(withStyles(styles), validation(strategy))(
  TakeMeasurement
)
