import React, { createElement } from 'react'
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

const styles = {
  paperWidthSm: {
    width: 700
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
  }
}

function TaskForm(props) {
  const { task, classes, ...other } = props

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
            <IconButton color="inherit" onClick={props.onClose}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        {createElement(forms[task.taskDefinitionKey], { task })}
      </Dialog>
    )
  )
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
