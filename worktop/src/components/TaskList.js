/* global App */
import React, { Component, Fragment } from 'react'
import compose from 'recompose/compose'
import format from 'date-fns/format'

import { withStyles } from 'material-ui/styles'
import Card, { CardActions, CardContent } from 'material-ui/Card'
import Typography from 'material-ui/Typography'
import Button from 'material-ui/Button'

import { jsonrpc } from 'homemaster-jslib'
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
    tasks: [],
    taskOpen: false,
    task: null
  }

  componentDidMount = () => {
    this.getTasks()
  }

  getTasks = () => {
    jsonrpc({
      method: 'bpmn.task.get',
      params: [App.processKey]
    }).then(ret => {
      this.setState({ tasks: ret })
    })
  }

  render() {
    const { classes } = this.props
    const { task: currentTask, taskOpen } = this.state

    return (
      <Fragment>
        <div className={classes.root}>
          {this.state.tasks.map((task, i) => (
            <TaskItem
              classes={classes}
              key={i}
              task={task}
              onOpenTask={() => this.setState({ task, taskOpen: true })}
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

export default compose(withStyles(styles))(TaskList)
