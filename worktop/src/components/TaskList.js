import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import compose from 'recompose/compose'
import find from 'lodash.find'

import { withStyles } from 'material-ui/styles'
import Card, { CardActions, CardContent } from 'material-ui/Card'
import Typography from 'material-ui/Typography'
import Button from 'material-ui/Button'

import { jsonrpc, message } from 'homemaster-jslib'

import { fetchUserTasks } from 'model/actions'
import TaskForm from 'tasks/TaskForm'

const styles = {
  root: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  taskItem: {
    flexBasis: 250,
    marginRight: 16,
    marginBottom: 16
  },
  due: {
    margin: '6px 0'
  }
}

const TASK_REFRESH_INTERVAL = 1000 * 60

const TaskItem = props => {
  const { classes, task, onOpenTask } = props
  const { processVariables: variables } = task

  return (
    <Card className={classes.taskItem}>
      <CardContent>
        <Typography className={classes.due} color="textSecondary">
          {variables.externalOrderId}
        </Typography>
        <Typography variant="headline" component="h2">
          {task.name}
        </Typography>
        <Typography className={classes.due} color="textSecondary">
          {variables.customerRegionName} {variables.customerName}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" color="primary" onClick={onOpenTask}>
          处理任务
        </Button>
      </CardActions>
    </Card>
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
                index={i}
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
