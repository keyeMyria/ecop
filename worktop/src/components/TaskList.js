/* global App */
import React, { Component } from 'react'
import compose from 'recompose/compose'
import format from 'date-fns/format'

import { withStyles } from 'material-ui/styles'
import Card, { CardActions, CardContent } from 'material-ui/Card'
import Typography from 'material-ui/Typography'
import Button from 'material-ui/Button'

import { jsonrpc } from 'homemaster-jslib'

const styles = {
  root: {
    display: 'flex'
  },

  taskItem: {
    flexBasis: 250
  },

  due: {
    margin: '6px 0'
  }
}

const TaskItem = props => {
  const { classes, task } = props

  return (
    <Card className={classes.taskItem}>
      <CardContent>
        <Typography variant="headline" component="h2">
          {task.name}
        </Typography>
        <Typography className={classes.due} color="textSecondary">
          {format(new Date(task.due), 'YYYY/MM/DD HH:MM:SS')}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small">处理任务</Button>
      </CardActions>
    </Card>
  )
}

class TaskList extends Component {
  state = {
    tasks: []
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

    return (
      <div className={classes.root}>
        {this.state.tasks.map((task, i) => (
          <TaskItem classes={classes} key={i} task={task} />
        ))}
      </div>
    )
  }
}

export default compose(withStyles(styles))(TaskList)
