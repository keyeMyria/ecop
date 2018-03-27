import React, { Component, createElement } from 'react'
import PropTypes from 'prop-types'
import compose from 'recompose/compose'
import { connect } from 'react-redux'

import AppBar from 'material-ui/AppBar'
import Dialog from 'material-ui/Dialog'
import Toolbar from 'material-ui/Toolbar'
import Typography from 'material-ui/Typography'
import IconButton from 'material-ui/IconButton'
import CloseIcon from 'material-ui-icons/Close'
import { withStyles } from 'material-ui/styles'

import { screen, message } from 'homemaster-jslib'
import TaskListIcon from 'homemaster-jslib/svg-icons/TaskList'

import { fetchProcessVariables } from 'model/actions'
import ConfirmMeasurementDate from './ConfirmMeasurementDate'
import TakeMeasurement from './TakeMeasurement'
import TaskHeader from './TaskHeader'

const forms = {
  ConfirmMeasurementDate: ConfirmMeasurementDate,
  TakeMeasurement: TakeMeasurement
}

const styles = theme => ({
  paperWidthSm: {
    width: 700,
    maxWidth: 700
  },
  appbar: {
    position: 'relative'
  },
  toolbar: {
    paddingRight: 0,
    paddingLeft: 16
  },
  title: {
    flex: 1,
    marginLeft: 16
  },
  content: {
    overflowY: 'auto',
    padding: 16,
    maxHeight: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
    [theme.breakpoints.up('sm')]: {
      maxHeight: `calc(100vh - ${
        theme.mixins.toolbar[theme.breakpoints.up('sm')].minHeight
      }px)`
    }
  }
})

class TaskForm extends Component {
  /**
   * Whenever the taks form is opened, we load the process variables
   */
  componentWillReceiveProps = nextProps => {
    if (!this.props.open && nextProps.open) {
      this.props.dispatch(
        fetchProcessVariables(nextProps.task.processInstanceId)
      )
    }
  }

  submitTask = values => {
    message.success('当前任务提交成功')
    this.props.onClose()
  }

  render = () => {
    const { task, variables, dispatch, classes, ...other } = this.props

    return (
      task && (
        <Dialog
          classes={{ paperWidthSm: classes.paperWidthSm }}
          fullScreen={screen.isMobile()}
          {...other}
        >
          <AppBar className={classes.appbar}>
            <Toolbar className={classes.toolbar}>
              <TaskListIcon />
              <Typography
                variant="title"
                color="inherit"
                className={classes.title}
              >
                {task.name}
              </Typography>
              <IconButton color="inherit" onClick={other.onClose}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          <div className={classes.content}>
            <TaskHeader task={task} variables={variables} />
            {createElement(forms[task.taskDefinitionKey], {
              task,
              variables,
              submitTask: this.submitTask
            })}
          </div>
        </Dialog>
      )
    )
  }
}

TaskForm.propTypes = {
  /**
   *　Called when the task dialog is requested to be closed
   */
  onClose: PropTypes.func,
  /**
   *　Whether the form shall be shown
   */
  open: PropTypes.bool.isRequired,
  /**
   * The task object to load. The form is derived from the `taskDefinitionKey`
   * attribute of the task object
   */
  task: PropTypes.object,
  /**
   * An object containing all the process instance variables
   */
  variables: PropTypes.object
}

const mapStateToProps = state => ({
  variables: state.task.processVariables
})

export default compose(connect(mapStateToProps), withStyles(styles))(TaskForm)
