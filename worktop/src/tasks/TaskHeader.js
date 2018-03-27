import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

function TaskHeader(props) {
  const { variables } = props

  return (
    <Fragment>
      <div>宜家订单号: {variables.externalOrderId}</div>
      <div>顾客姓名: {variables.customerName}</div>
    </Fragment>
  )
}

TaskHeader.propTypes = {
  /**
   * An object containing all the process instance variables
   */
  variables: PropTypes.object.isRequired
}

export default TaskHeader
