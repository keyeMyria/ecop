import React, { Component, createElement } from 'react'
import PropTypes from 'prop-types'
import AppBar from 'material-ui/AppBar'
import Dialog from 'material-ui/Dialog'
import Toolbar from 'material-ui/Toolbar'
import Typography from 'material-ui/Typography'
import IconButton from 'material-ui/IconButton'
import CloseIcon from 'material-ui-icons/Close'
import { withStyles } from 'material-ui/styles'

import { screen } from 'homemaster-jslib'
import TaskListIcon from 'homemaster-jslib/svg-icons/TaskList'

import ConfirmMeasurementDate from './ConfirmMeasurementDate'

const forms = {
  ConfirmMeasurementDate: ConfirmMeasurementDate
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
    maxHeight: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
    [theme.breakpoints.up('sm')]: {
      maxHeight: `calc(100vh - ${
        theme.mixins.toolbar[theme.breakpoints.up('sm')].minHeight
      }px)`
    }
  }
})

class TaskForm extends Component {
  componentWillReceiveProps = nextProps => {
    if (this.props.task !== nextProps.task) {
      console.log('Start loading new task', nextProps.task)
    }
  }

  render = () => {
    const { task, classes, ...other } = this.props

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
            <div>Taks ID: {task.id}</div>
            {createElement(forms[task.taskDefinitionKey], { task })}
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
   * Name of the task form to load. This should be the same as the
   * `taskDefinitionKey` of the bpmn definition
   */
  task: PropTypes.object
}
export default withStyles(styles)(TaskForm)
