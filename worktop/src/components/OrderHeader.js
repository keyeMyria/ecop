import isEmpty from 'lodash/isEmpty'
import React from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'
import green from '@material-ui/core/colors/green'
import PersonIcon from '@material-ui/icons/Person'
import PhoneIphoneIcon from '@material-ui/icons/PhoneIphone'
import PlaceIcon from '@material-ui/icons/Place'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'

import RegionName from 'widget/RegionName'

const styles = theme => ({
  header: {
    color: green[900],
    backgroundColor: green[100],
    padding: '8px 16px'
  },
  icon: {
    verticalAlign: 'middle',
    '&:not(:first-child)': {
      marginLeft: 8
    }
  },
  table: {
    marginTop: 8
  },
  row: {
    height: 'auto'
  },
  cell: {
    padding: '2px 0',
    color: green[900],
    fontSize: 'inherit'
  }
})

function OrderHeader(props) {
  const { classes } = props
  const {
    externalOrderId,
    factoryNumber,
    customerName,
    customerMobile,
    customerRegionCode,
    customerStreet,
    orderItems
  } = props.variables

  return (
    <div className={classes.header}>
      <div>
        订单号:&nbsp;
        {factoryNumber
          ? `${externalOrderId} / ${factoryNumber}`
          : externalOrderId}
      </div>
      <div>
        <PersonIcon className={classes.icon} /> {customerName}
        <PhoneIphoneIcon className={classes.icon} /> {customerMobile}
        <PlaceIcon className={classes.icon} />
        <RegionName regionCode={customerRegionCode} />
        {customerStreet}
      </div>
      {!isEmpty(orderItems) && (
        <Table className={classes.table}>
          <TableBody>
            {orderItems.map((oi, idx) => (
              <TableRow key={idx} className={classes.row}>
                <TableCell className={classes.cell}>
                  <b>{oi.model}</b> {oi.itemName}
                </TableCell>
                <TableCell className={classes.cell} padding="none">
                  {oi.quantity}米
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

OrderHeader.propTypes = {
  /**
   * An object containing all the process instance variables
   */
  variables: PropTypes.object.isRequired
}

export default withStyles(styles)(OrderHeader)
