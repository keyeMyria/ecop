import React, { Fragment } from 'react'
import format from 'date-fns/format'
import validation from 'react-validation-mixin'

import TextField from 'material-ui/TextField'
import DatePicker from 'material-ui-pickers/DatePicker'
import ArrowLeftIcon from 'material-ui-icons/KeyboardArrowLeft'
import ArrowRightIcon from 'material-ui-icons/KeyboardArrowRight'

import { strategy, Field, ValidatedForm } from 'form'

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
          value={format(variables.scheduledMeasurementDate, 'YYYY/MM/DD')}
        />

        <Field
          component={DatePicker}
          label="确认测量日期"
          autoOk
          name="confirmedMeasurementDate"
          disablePast
          leftArrowIcon={<ArrowLeftIcon />}
          rightArrowIcon={<ArrowRightIcon />}
          value={confirmedMeasurementDate}
          labelFunc={() =>
            confirmedMeasurementDate
              ? format(confirmedMeasurementDate, 'YYYY/MM/DD')
              : ''
          }
          error={!!this.getFieldError('confirmedMeasurementDate')}
          helperText={this.getFieldError('confirmedMeasurementDate')}
          onChange={this.handleChange('confirmedMeasurementDate', 'datepicker')}
        />
      </Fragment>
    )
  }
}

export default validation(strategy)(ConfirmMeasurementDate)
