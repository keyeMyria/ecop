import React from 'react'
import PropTypes from 'prop-types'

import { withStyles } from 'material-ui/styles'
import green from 'material-ui/colors/green'

import RegionName from 'widget/RegionName'

const styles = theme => ({
  header: {
    color: green[900],
    backgroundColor: green[100],
    padding: 16
  }
})

function TaskHeader(props) {
  const { classes } = props
  const {
    externalOrderId,
    factoryNumber,
    customerName,
    customerMobile,
    customerRegionCode,
    customerStreet
  } = props.variables

  return (
    <div className={classes.header}>
      <div>
        订单号:&nbsp;
        {factoryNumber
          ? `${externalOrderId} / ${factoryNumber}`
          : externalOrderId}
      </div>
      <div>顾客姓名: {customerName}</div>
      <div>顾客手机: {customerMobile}</div>
      <div>
        顾客地址:&nbsp;
        <RegionName regionCode={customerRegionCode} />
        {customerStreet}
      </div>
    </div>
  )
}

TaskHeader.propTypes = {
  /**
   * An object containing all the process instance variables
   */
  variables: PropTypes.object.isRequired
}

export default withStyles(styles)(TaskHeader)
