import React, { Fragment } from 'react'
import validation from 'react-validation-mixin'
import compose from 'recompose/compose'
import format from 'date-fns/format'

import { withStyles } from 'material-ui/styles'
import TextField from 'material-ui/TextField'
import Button from 'material-ui/Button'
import DatePicker from 'material-ui-pickers/DatePicker'
import ArrowLeftIcon from 'material-ui-icons/KeyboardArrowLeft'
import ArrowRightIcon from 'material-ui-icons/KeyboardArrowRight'

import PaperPlaneIcon from 'homemaster-jslib/svg-icons/PaperPlane'
import { strategy, ValidatedForm, Field } from 'form'

const styles = {
  submitButton: {
    marginTop: 12,
    width: '50%'
  },
  buttonRow: {
    textAlign: 'center'
  },
  buttonIcon: {
    marginRight: 10
  }
}

class ConfirmMeasurementDate extends ValidatedForm {
  state = {
    values: {
      confirmedMeasurementDate: null
    }
  }

  validatorTypes = strategy.createSchema(
    {
      confirmedMeasurementDate: 'required'
    },
    {
      'required.confirmedMeasurementDate': '确认日期必须输入'
    }
  )

  handleSubmit = () => {
    this.props.validate(error => {
      if (!error) {
        this.props.submitTask(this.state.values)
      }
    })
  }

  render = () => {
    const { task, variables, classes } = this.props
    const { values } = this.state

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
          value={values.confirmedMeasurementDate}
          labelFunc={date => (date ? format(date, 'YYYY/MM/DD') : '')}
          onChange={this.handleChange('confirmedMeasurementDate', 'datepicker')}
          error={!!this.getFieldError('confirmedMeasurementDate')}
          helperText={this.getFieldError('confirmedMeasurementDate')}
        />

        <div className={classes.buttonRow}>
          <Button
            variant="raised"
            color="primary"
            className={classes.submitButton}
            onClick={this.handleSubmit}
          >
            <PaperPlaneIcon className={classes.buttonIcon} />提交数据
          </Button>
        </div>
      </Fragment>
    )
  }
}

export default compose(withStyles(styles), validation(strategy))(
  ConfirmMeasurementDate
)
