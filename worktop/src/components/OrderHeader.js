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
import Grid from '@material-ui/core/Grid'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'

import CloseBox from 'homemaster-jslib/svg-icons/CloseBox'

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
  },
  serviceNotRequested: {
    color: theme.palette.secondary.main
  }
})

function OrderHeader(props) {
  const { classes } = props
  const {
    externalOrderId,
    customerName,
    customerMobile,
    customerRegionCode,
    customerStreet,
    orderItems,
    isMeasurementRequested,
    isInstallationRequested = true
  } = props.variables

  return (
    <div className={classes.header}>
      <div>订单号:&nbsp;{externalOrderId}</div>
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

      <Grid container justify="center" spacing={24}>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isMeasurementRequested}
                value="isMeasurementRequested"
                icon={<CloseBox color="secondary" />}
                color={isMeasurementRequested ? 'primary' : 'secondary'}
              />
            }
            classes={{
              label: isMeasurementRequested ? null : classes.serviceNotRequested
            }}
            label={isMeasurementRequested ? '需要测量' : '不需要测量!'}
          />
        </Grid>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isInstallationRequested}
                value="isInstallationRequested"
                icon={<CloseBox color="secondary" />}
                color={isInstallationRequested ? 'primary' : 'secondary'}
              />
            }
            classes={{
              label: isInstallationRequested
                ? null
                : classes.serviceNotRequested
            }}
            label={isInstallationRequested ? '需要安装' : '不需要安装!'}
          />
        </Grid>
      </Grid>
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
