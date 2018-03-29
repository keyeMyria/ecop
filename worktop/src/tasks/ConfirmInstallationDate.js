import React, { Fragment } from 'react'
import format from 'date-fns/format'
import validation from 'react-validation-mixin'

import TextField from 'material-ui/TextField'
import DatePicker from 'material-ui-pickers/DatePicker'
import ArrowLeftIcon from 'material-ui-icons/KeyboardArrowLeft'
import ArrowRightIcon from 'material-ui-icons/KeyboardArrowRight'

import { strategy, Field, ValidatedForm } from 'form'

class ConfirmInstallationDate extends ValidatedForm {
  state = { values: {} }

  validatorTypes = strategy.createInactiveSchema(
    {
      confirmedInstallationDate: 'required'
    },
    {
      'required.confirmedInstallationDate': '确认安装日期必须输入'
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
    const { confirmedInstallationDate } = this.state.values

    return (
      <Fragment>
        <Field
          label="预约安装日期"
          component={TextField}
          disabled
          value={format(variables.scheduledInstallationDate, 'YYYY/MM/DD')}
        />

        <Field
          component={DatePicker}
          label="确认安装日期"
          autoOk
          name="confirmedInstallationDate"
          disablePast
          leftArrowIcon={<ArrowLeftIcon />}
          rightArrowIcon={<ArrowRightIcon />}
          value={confirmedInstallationDate}
          labelFunc={() =>
            confirmedInstallationDate
              ? format(confirmedInstallationDate, 'YYYY/MM/DD')
              : ''
          }
          error={!!this.getFieldError('confirmedInstallationDate')}
          helperText={this.getFieldError('confirmedInstallationDate')}
          onChange={this.handleChange(
            'confirmedInstallationDate',
            'datepicker'
          )}
        />
      </Fragment>
    )
  }
}

export default validation(strategy)(ConfirmInstallationDate)
