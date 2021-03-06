/* global App, wx */

/**
 * This frame is used for mobile scanning of the shipment label. It is used
 * for both the shipping and receiving process.
 */
import React, { Fragment } from 'react'
import queryString from 'query-string'
import parse from 'url-parse'

import { withStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import green from '@material-ui/core/colors/green'
import Button from '@material-ui/core/Button'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'

import { jsonrpc } from 'homemaster-jslib'
import QrcodeIcon from 'homemaster-jslib/svg-icons/Qrcode'

import { hasPermission } from 'permission'
import RegionName from 'widget/RegionName'

const styles = theme => ({
  viewport: theme.viewport,
  appbar: {
    position: 'relative'
  },
  content: {
    padding: theme.spacing.unit,
    flexGrow: 1,
    overflowY: 'auto',
    height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`
  },
  success: {
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
    textAlign: 'center'
  },
  successIcon: {
    width: '30%',
    height: '30%',
    color: green[500]
  },
  buttons: {
    justifyContent: 'space-around',
    marginTop: theme.spacing.unit * 3
  }
})

class ShipFrame extends React.Component {
  state = { variables: null }

  componentDidMount = () => {
    const qs = queryString.parse(window.location.search)
    if (hasPermission('shipment.receive')) this.doRecieve(qs.orderId, qs.pkgId)
  }

  doRecieve = (orderId, pkgId) => {
    jsonrpc({
      method: 'bpmn.worktop.receive',
      params: [orderId, pkgId]
    }).then(ret => {
      this.setState({ variables: ret })
    })
  }

  handleScan = () => {
    wx.scanQRCode({
      needResult: 1,
      scanType: ['qrCode'],
      success: ret => {
        const url = parse(ret.resultStr)
        const qs = queryString.parse(url.query)
        this.doRecieve(qs.orderId, qs.pkgId)
      }
    })
  }

  render() {
    const { variables } = this.state
    const { classes } = this.props

    return (
      <div className={classes.viewport}>
        <AppBar className={classes.appbar}>
          <Toolbar>
            <Typography variant="title" color="inherit">
              订单收货
            </Typography>
          </Toolbar>
        </AppBar>

        <div className={classes.content}>
          {hasPermission('shipment.receive') ? (
            <Fragment>
              {variables && (
                <Fragment>
                  <Typography variant="headline" component="h2">
                    <RegionName regionCode={variables.customerRegionCode} />
                  </Typography>
                  <Typography variant="headline" component="h2">
                    {variables.customerName} {variables.customerMobile}
                  </Typography>

                  <div className={classes.success}>
                    <CheckCircleIcon className={classes.successIcon} />
                  </div>

                  <Typography variant="headline" component="h2">
                    订单{variables.externalOrderId}收货完成
                  </Typography>
                </Fragment>
              )}
            </Fragment>
          ) : (
            <Typography variant="headline" component="h2">
              好奇心是个优点，请保持。
            </Typography>
          )}

          {App.isWeixin && (
            <Toolbar className={classes.buttons}>
              <Button
                variant="raised"
                color="primary"
                onClick={this.handleScan}
              >
                <QrcodeIcon />&nbsp; 继续扫描
              </Button>
            </Toolbar>
          )}
        </div>
      </div>
    )
  }
}

export default withStyles(styles)(ShipFrame)
