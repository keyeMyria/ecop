import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import compose from 'recompose/compose'
import format from 'date-fns/format'

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
    flexBasis: 250
  },

  due: {
    margin: '6px 0'
  }
}

const TaskItem = props => {
  const { classes, task, onOpenTask } = props

  return (
    <Card className={classes.taskItem}>
      <CardContent>
        <Typography variant="headline" component="h2">
          {task.name}
        </Typography>
        <Typography className={classes.due} color="textSecondary">
          {format(new Date(task.due), 'YYYY/MM/DD HH:MM')}
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
    taskOpen: false,
    currentTask: null
  }

  componentDidMount = () => {
    this.getTasks()
  }

  getTasks = () => {
    this.props.dispatch(fetchUserTasks())
  }

  onOpenTask = task => {
    jsonrpc({
      method: 'bpmn.task.get',
      params: [task.id]
    }).then(task => {
      if (task) {
        this.setState({ currentTask: task, taskOpen: true })
      } else {
        message.error('该任务可能已被其他用户完成!', {
          callback: this.getTasks
        })
      }
    })
  }

  render() {
    const { classes, tasks } = this.props
    const { currentTask, taskOpen } = this.state

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
          open={taskOpen}
          task={currentTask}
          onClose={() => this.setState({ taskOpen: false })}
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
