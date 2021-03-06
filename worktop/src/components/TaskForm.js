import React, { Component, createElement } from 'react'
import PropTypes from 'prop-types'
import compose from 'recompose/compose'
import { connect } from 'react-redux'
import classNames from 'classnames'
import toDate from 'date-fns/toDate'

import { withStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Dialog from '@material-ui/core/Dialog'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import Badge from '@material-ui/core/Badge'
import Button from '@material-ui/core/Button'
import CloseIcon from '@material-ui/icons/Close'
import WorkIcon from '@material-ui/icons/Work'
import AlarmIcon from '@material-ui/icons/Alarm'
import InsertCommentIcon from '@material-ui/icons/InsertComment'

import { jsonrpc, screen, message } from 'homemaster-jslib'
import PaperPlaneIcon from 'homemaster-jslib/svg-icons/PaperPlane'

import { fetchUserTasks } from 'model/actions'
import OrderHeader from 'components/OrderHeader'
import TaskDueDialog from './TaskDue'
import CommentDialog from './TaskComment'

import ConfirmMeasurementDate from 'tasks/ConfirmMeasurementDate'
import TakeMeasurement from 'tasks/TakeMeasurement'
import MakeDrawing from 'tasks/MakeDrawing'
import CheckDrawing from 'tasks/CheckDrawing'
import ConfirmInstallationDate from 'tasks/ConfirmInstallationDate'
import InstallWorktop from 'tasks/InstallWorktop'
import CompleteERPOrder from 'tasks/CompleteERPOrder'
import AssignFactory from 'tasks/AssignFactory'

const forms = {
  AssignFactory,
  CheckDrawing,
  CompleteERPOrder,
  ConfirmInstallationDate,
  ConfirmMeasurementDate,
  InstallWorktop,
  MakeDrawing,
  TakeMeasurement,
  UpdateDrawing: MakeDrawing
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
    paddingBottom: 16,
    overflowY: 'auto',
    maxHeight: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
    [theme.breakpoints.up('sm')]: {
      maxHeight: `calc(100vh - ${
        theme.mixins.toolbar[theme.breakpoints.up('sm')].minHeight
      }px)`
    }
  },
  badgePlus: {
    backgroundColor: 'transparent',
    fontSize: '100%',
    right: -18
  },
  form: {
    paddingLeft: 16,
    paddingRight: 16
  },
  submitButton: theme.custom.submitButton,
  buttonRow: theme.custom.buttonRow,
  buttonIcon: theme.custom.buttonIcon
})

class TaskForm extends Component {
  state = {
    dueOpen: false,
    commentOpen: false
  }

  componentWillReceiveProps = nextProps => {
    if (!this.props.open && nextProps.open) {
      this.form = null
      this.innerForm = null
    }
  }

  changeDueDate = (newDue, reason) => {
    this.setState({ dueOpen: false })
    jsonrpc({
      method: 'bpmn.task.changeDue',
      params: [this.props.task.id, newDue, reason]
    }).then(() => {
      message.success('任务期限修改成功', { autoHide: 5000 })
      this.props.onClose()
      this.props.dispatch(fetchUserTasks())
    })
  }

  submitComment = comment => {
    this.setState({ commentOpen: false })
    jsonrpc({
      method: 'bpmn.task.comment.add',
      params: [this.props.task.id, comment]
    }).then(() => {
      message.success('备注添加成功', { autoHide: 5000 })
      this.props.onClose()
    })
  }

  submitForm = values => {
    jsonrpc({
      method: 'bpmn.task.complete',
      params: [this.props.task.id, this.props.task.taskDefinitionKey, values]
    }).then(success => {
      if (success) {
        message.success('当前任务提交成功', { autoHide: 5000 })
      } else {
        message.error('该任务可能已被其他用户完成!', { autoHide: 5000 })
      }
      this.props.onClose()
      this.props.dispatch(fetchUserTasks())
    })
  }

  /**
   * When submit button is clicked, the submitForm method of the form is invoked
   * to perform the validation. And if no errors are found, the the form will
   * then call the `submitForm` funciton passed as a prop to the form.
   */
  handleSubmit = () => {
    const form = this.innerForm || this.form
    ;(form.submitForm || form.refs.component.submitForm)()
  }

  render = () => {
    const { task, dispatch, classes, ...other } = this.props

    if (!task) return null
    const variables = task.processVariables

    return (
      <Dialog
        classes={{ paperWidthSm: classes.paperWidthSm }}
        fullScreen={screen.isMobile()}
        {...other}
      >
        <AppBar className={classes.appbar}>
          <Toolbar className={classes.toolbar}>
            <WorkIcon />
            <Typography
              variant="title"
              color="inherit"
              className={classes.title}
            >
              {task.name}
            </Typography>
            <Tooltip title="修改期限">
              <IconButton
                color="inherit"
                onClick={() => this.setState({ dueOpen: true })}
              >
                <AlarmIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="任务备注">
              <IconButton
                color="inherit"
                onClick={() => this.setState({ commentOpen: true })}
              >
                <Badge
                  color="secondary"
                  badgeContent={task.comments.length || '+'}
                  classes={{
                    badge: classNames({
                      [classes.badgePlus]: task.comments.length === 0
                    })
                  }}
                >
                  <InsertCommentIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <IconButton color="inherit" onClick={other.onClose}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <div className={classes.content}>
          <OrderHeader variables={variables} />

          <div className={classes.form}>
            {createElement(forms[task.taskDefinitionKey], {
              variables,
              task,
              submitForm: this.submitForm,
              // for use with validation
              ref: form => {
                this.form = form
              },
              // for use with withStyles
              innerRef: form => {
                this.innerForm = form
              }
            })}
          </div>

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
          <TaskDueDialog
            open={this.state.dueOpen}
            due={toDate(task.due)}
            onChange={this.changeDueDate}
            onCancel={() => this.setState({ dueOpen: false })}
          />
          <CommentDialog
            open={this.state.commentOpen}
            comments={task.comments}
            onSubmitComment={this.submitComment}
            onCancel={() => this.setState({ commentOpen: false })}
          />
        </div>
      </Dialog>
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
