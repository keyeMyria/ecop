/**
 * This frame is used for mobile scanning of the shipment label. It is used
 * for both the shipping and receiving process.
 */
import React from 'react'
import queryString from 'query-string'

import { withStyles } from 'material-ui/styles'
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar'
import Typography from 'material-ui/Typography'
import { green } from 'material-ui/colors'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'

import { jsonrpc } from 'homemaster-jslib'
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
  }
})

class ShipFrame extends React.Component {
  state = { variables: null }

  componentDidMount = () => {
    const qs = queryString.parse(window.location.search)

    jsonrpc({
      method: 'bpmn.worktop.receive',
      params: [qs.orderId, qs.pkgId]
    }).then(ret => {
      this.setState({ variables: ret })
    })
  }

  render() {
    const { variables } = this.state
    const { classes } = this.props

    return (
      <div className={classes.viewport}>
        <AppBar className={classes.appbar}>
          <Toolbar>
            <Typography variant="title" color="inherit" noWrap>
              台面收货
            </Typography>
          </Toolbar>
        </AppBar>

        {variables && (
          <div className={classes.content}>
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
          </div>
        )}
      </div>
    )
  }
}

export default withStyles(styles)(ShipFrame)
