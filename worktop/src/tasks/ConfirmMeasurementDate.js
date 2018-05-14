import React, { Fragment } from 'react'
import validation from 'react-validation-mixin'

import TextField from '@material-ui/core/TextField'
import DatePicker from 'material-ui-pickers/DatePicker'
import ArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft'
import ArrowRightIcon from '@material-ui/icons/KeyboardArrowRight'

import { strategy, Field, ValidatedForm } from 'form'
import dateFormat from 'utils/date-fns'
import FileUploader from 'widget/FileUploader'

class ConfirmMeasurementDate extends ValidatedForm {
  state = { values: {} }

  validatorTypes = strategy.createInactiveSchema(
    {
      confirmedMeasurementDate: 'required'
    },
    {
      'required.confirmedMeasurementDate': '确认测量日期必须输入'
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
    const { variables } = this.props
    const { confirmedMeasurementDate } = this.state.values

    return (
      <Fragment>
        <Field
          label="预约测量日期"
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
          initiallyExpanded={false}
          InputLabelProps={{
            shrink: true
          }}
          value={variables.orderFile}
        />

        <Field
          component={DatePicker}
          label="确认测量日期"
          autoOk
          name="confirmedMeasurementDate"
          disablePast
          leftArrowIcon={<ArrowLeftIcon />}
          rightArrowIcon={<ArrowRightIcon />}
          form={this}
          labelFunc={() => dateFormat(confirmedMeasurementDate, 'YYYY/MM/DD')}
          onChange={this.handleChange('confirmedMeasurementDate', 'datepicker')}
        />
      </Fragment>
    )
  }
}

export default validation(strategy)(ConfirmMeasurementDate)
