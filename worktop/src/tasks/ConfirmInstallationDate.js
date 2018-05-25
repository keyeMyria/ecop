import React, { Fragment } from 'react'
import validation from 'react-validation-mixin'

import TextField from '@material-ui/core/TextField'
import DatePicker from 'material-ui-pickers/DatePicker'
import ArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft'
import ArrowRightIcon from '@material-ui/icons/KeyboardArrowRight'

import { strategy, Field, ValidatedForm } from 'form'
import dateFormat from 'utils/date-fns'
import FileUploader from 'widget/FileUploader'

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
    const taskName = variables.isInstallationRequested ? '安装' : '送货'

    return (
      <Fragment>
        <Field
          label={`预约${taskName}日期`}
          component={TextField}
          disabled
          value={dateFormat(variables.scheduledInstallationDate, 'YYYY/MM/DD')}
        />

        <FileUploader
          label="生产图纸"
          fullWidth
          margin="normal"
          allowUpload={false}
          allowDelete={false}
          initiallyExpanded={false}
          InputLabelProps={{
            shrink: true
          }}
          value={variables.productionDrawing}
        />

        <Field
          component={DatePicker}
          label={`确认${taskName}日期`}
          autoOk
          name="confirmedInstallationDate"
          disablePast
          leftArrowIcon={<ArrowLeftIcon />}
          rightArrowIcon={<ArrowRightIcon />}
          form={this}
          labelFunc={() => dateFormat(confirmedInstallationDate, 'YYYY/MM/DD')}
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
