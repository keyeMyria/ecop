import React, { Fragment } from 'react'

export default function TaskHeader(props) {
  const { task } = props

  return (
    <Fragment>
      <div>Taks ID: {task.id}</div>
      <div>Process Id: {task.processInstanceId}</div>
    </Fragment>
  )
}
