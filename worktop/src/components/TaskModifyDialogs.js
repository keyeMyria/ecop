import React, { Component } from 'react'
import PropTypes from 'prop-types'
import isSameDay from 'date-fns/isSameDay'

import { withStyles } from 'material-ui/styles'
import Dialog from 'material-ui/Dialog'
import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'
import DatePicker from 'material-ui-pickers/DatePicker/DatePicker'
import ArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft'
import ArrowRightIcon from '@material-ui/icons/KeyboardArrowRight'

import { screen, message } from 'homemaster-jslib'

const styles = theme => ({
  wrapper: {
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingBottom: theme.spacing.unit
  },
  paperWidthSm: {
    maxWidth: 700,
    width: 350
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'space-around'
  }
})

class TaskDueDialog extends Component {
  state = {
    newDue: null,
    reason: ''
  }

  handleChange = (field, value) => {
    this.setState({ [field]: value })
  }

  onSubmit = () => {
    let { reason, newDue } = this.state
    const { onChange, due: oldDue } = this.props

    reason = reason.trim()
    if (!reason) {
      message.error('变更原因必须输入')
    } else if (isSameDay(newDue, oldDue)) {
      message.error('任务期限未修改')
    } else {
      onChange(newDue, reason)
    }
  }

  render() {
    const { open, due, onCancel, classes } = this.props

    return (
      <Dialog
        open={open}
        onClose={onCancel}
        classes={{ paperWidthSm: classes.paperWidthSm }}
        fullScreen={screen.isMobile()}
      >
        <DatePicker
          date={this.state.newDue || due}
          disablePast
          leftArrowIcon={<ArrowLeftIcon />}
          rightArrowIcon={<ArrowRightIcon />}
          onChange={date => this.handleChange('newDue', date)}
        />

        <div className={classes.wrapper}>
          <TextField
            required
            fullWidth
            margin="normal"
            InputLabelProps={{
              shrink: true
            }}
            label="更改原因"
            rows={5}
            multiline
            value={this.state.reason}
            onChange={e => this.handleChange('reason', e.target.value)}
          />

          <div className={classes.buttonRow}>
            <Button variant="raised" color="primary" onClick={this.onSubmit}>
              确定
            </Button>
            <Button variant="raised" color="secondary" onClick={onCancel}>
              取消
            </Button>
          </div>
        </div>
      </Dialog>
    )
  }
}

TaskDueDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  /**
   * The current due date of the task
   */
  due: PropTypes.instanceOf(Date),
  /**
   * The function to invoke when due is changed. It will be called as:
   *     onChange(newDue, reason)
   */
  onChange: PropTypes.func.isRequired,
  /**
   * The function to invoke to close the dialog without doing anyting
   */
  onCancel: PropTypes.func.isRequired
}

TaskDueDialog = withStyles(styles)(TaskDueDialog)

export { TaskDueDialog }
