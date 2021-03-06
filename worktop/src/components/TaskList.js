import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import compose from 'recompose/compose'
import find from 'lodash.find'
import toDate from 'date-fns/toDate'

import { withStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import ButtonBase from '@material-ui/core/ButtonBase'
import AlarmIcon from '@material-ui/icons/Alarm'

import { jsonrpc, message } from 'homemaster-jslib'

import { fetchUserTasks } from 'model/actions'
import dateFormat from 'utils/date-fns'
import TaskForm from './TaskForm'

const styles = {
  root: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  taskItem: {
    flexBasis: 230,
    marginRight: 16,
    marginBottom: 16
  },
  taskPaper: {
    padding: 16,
    width: '100%',
    textAlign: 'left'
  },
  due: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 3
  },
  alarm: {
    marginRight: 5
  }
}

const TASK_REFRESH_INTERVAL = 1000 * 60

const TaskItem = props => {
  const { classes, task, onOpenTask } = props
  const { processVariables: variables } = task
  // toDate is necessary for IE as it will not parse task.due correctly
  const timeToDue = toDate(task.due) - new Date()
  let iconColor = undefined

  if (timeToDue < 0) {
    iconColor = 'error'
  } else if (timeToDue < 24 * 3600 * 1000) {
    iconColor = 'primary'
  }

  return (
    <ButtonBase focusRipple className={classes.taskItem} onClick={onOpenTask}>
      <Paper className={classes.taskPaper}>
        <Typography color="textSecondary">
          {variables.externalOrderId}
        </Typography>
        <Typography variant="headline" component="h2">
          {task.name}
        </Typography>
        <Typography color="textSecondary">
          {variables.customerRegionName} {variables.customerName}
        </Typography>
        <div className={classes.due}>
          <AlarmIcon color={iconColor} className={classes.alarm} />
          <Typography color="textSecondary">
            {dateFormat(task.due, 'YYYY/MM/DD HH:mm:ss')}
          </Typography>
        </div>
      </Paper>
    </ButtonBase>
  )
}

class TaskList extends Component {
  state = {
    currentTask: null
  }

  componentDidMount = () => {
    this.refreshTasks()
    this.timer = setInterval(this.refreshTasks, TASK_REFRESH_INTERVAL)
  }

  componentWillUnmount = () => {
    clearInterval(this.timer)
  }

  componentWillReceiveProps = nextProps => {
    /**
     * When tasks is refreshed and the current open task is no longer in the
     * list, current task shall abort.
     */
    if (this.state.currentTask && this.props.tasks !== nextProps.tasks) {
      if (!find(nextProps.tasks, o => o.id === this.state.currentTask.id)) {
        message.error('当前任务已被其他用户完成，请中断执行', {
          callback: this.setState({ currentTask: null })
        })
      }
    }
  }

  refreshTasks = () => {
    this.props.dispatch(fetchUserTasks())
  }

  onOpenTask = task => {
    jsonrpc({
      method: 'bpmn.task.get',
      params: [task.id]
    }).then(task => {
      if (task) {
        this.setState({ currentTask: task })
      } else {
        message.error('该任务可能已被其他用户完成!', {
          callback: this.refreshTasks
        })
      }
    })
  }

  render() {
    const { classes, tasks } = this.props
    const { currentTask } = this.state

    return (
      <Fragment>
        <div className={classes.root}>
          {tasks.length === 0 && <p>当前任务清单为空。</p>}
          {tasks &&
            tasks.map((task, i) => (
              <TaskItem
                classes={classes}
                key={i}
                task={task}
                onOpenTask={() => this.onOpenTask(task)}
              />
            ))}
        </div>
        <TaskForm
          open={!!currentTask}
          task={currentTask}
          onClose={() => this.setState({ currentTask: null })}
        />
      </Fragment>
    )
  }
}

TaskList.propTypes = {
  /**
   * The `TaskList` accepts a list of camunda `task` objects in prop `tasks`
   */
  tasks: PropTypes.arrayOf(PropTypes.object)
}

const mapStateToProps = state => ({
  tasks: state.task.userTasks
})

export default compose(connect(mapStateToProps), withStyles(styles))(TaskList)
