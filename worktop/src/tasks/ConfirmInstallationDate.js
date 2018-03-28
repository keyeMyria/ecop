import React, { Fragment, Component } from 'react'
import format from 'date-fns/format'

import TextField from 'material-ui/TextField'
import DatePicker from 'material-ui-pickers/DatePicker'
import ArrowLeftIcon from 'material-ui-icons/KeyboardArrowLeft'
import ArrowRightIcon from 'material-ui-icons/KeyboardArrowRight'

import { Field } from 'form'

export default class ConfirmInstallationDate extends Component {
  state = {}

  componentWillReceiveProps = nextProps => {
    // set default value for confirmedInstallationDate
    if (this.props.variables !== nextProps.variables) {
      this.setState({
        confirmedInstallationDate: nextProps.variables.scheduledInstallationDate
      })
    }
  }

  submitForm = () => {
    this.props.submitForm(this.state)
  }

  render = () => {
    const { variables } = this.props

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
          value={this.state.confirmedInstallationDate}
          labelFunc={date => (date ? format(date, 'YYYY/MM/DD') : '')}
          onChange={date => this.setState({ confirmedInstallationDate: date })}
        />
      </Fragment>
    )
  }
}
