import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

import AddressText from 'widget/AddressText'

function TaskHeader(props) {
  const {
    externalOrderId,
    customerName,
    customerMobile,
    customerRegionCode,
    customerStreet
  } = props.variables

  return (
    <Fragment>
      <div>订单号:{externalOrderId}</div>
      <div>顾客姓名:{customerName}</div>
      <div>顾客手机:{customerMobile}</div>
      <div>
        顾客地址:
        <AddressText regionCode={customerRegionCode} street={customerStreet} />
      </div>
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
