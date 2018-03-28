import React, { Fragment, Component } from 'react'
import format from 'date-fns/format'

import TextField from 'material-ui/TextField'
import DatePicker from 'material-ui-pickers/DatePicker'
import ArrowLeftIcon from 'material-ui-icons/KeyboardArrowLeft'
import ArrowRightIcon from 'material-ui-icons/KeyboardArrowRight'

import { Field } from 'form'

export default class ConfirmMeasurementDate extends Component {
  state = {
    values: {
      confirmedMeasurementDate: null
    }
  }

  componentWillReceiveProps = nextProps => {
    // set default value for confirmedMeasurementDate
    if (this.props.variables !== nextProps.variables) {
      this.setState({
        values: {
          confirmedMeasurementDate: nextProps.variables.scheduledMeasurementDate
        }
      })
    }
  }

  getFormValues = () => this.state.values

  render = () => {
    const { variables } = this.props
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
          onChange={date =>
            this.setState({ values: { confirmedMeasurementDate: date } })
          }
        />
      </Fragment>
    )
  }
}
