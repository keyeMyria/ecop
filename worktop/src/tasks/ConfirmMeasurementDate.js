import React, { Fragment, Component } from 'react'
import format from 'date-fns/format'

import { withStyles } from 'material-ui/styles'
import TextField from 'material-ui/TextField'
import Button from 'material-ui/Button'
import DatePicker from 'material-ui-pickers/DatePicker'
import ArrowLeftIcon from 'material-ui-icons/KeyboardArrowLeft'
import ArrowRightIcon from 'material-ui-icons/KeyboardArrowRight'

import PaperPlaneIcon from 'homemaster-jslib/svg-icons/PaperPlane'
import { Field } from 'form'

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

class ConfirmMeasurementDate extends Component {
  state = {
    confirmedMeasurementDate: null
  }

  componentWillReceiveProps = nextProps => {
    // set default value for confirmedMeasurementDate
    if (this.props.variables !== nextProps.variables) {
      this.setState({
        confirmedMeasurementDate: nextProps.variables.scheduledMeasurementDate
      })
    }
  }

  handleSubmit = () => {
    this.props.submitTask(this.state)
  }

  render = () => {
    const { variables, classes } = this.props

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
          value={this.state.confirmedMeasurementDate}
          labelFunc={date => (date ? format(date, 'YYYY/MM/DD') : '')}
          onChange={date => this.setState({ confirmedMeasurementDate: date })}
        />

        <div className={classes.buttonRow}>
          <Button
            variant="raised"
            color="primary"
            className={classes.submitButton}
            onClick={this.handleSubmit}
          >
            <PaperPlaneIcon className={classes.buttonIcon} />提交任务
          </Button>
        </div>
      </Fragment>
    )
  }
}

export default withStyles(styles)(ConfirmMeasurementDate)
