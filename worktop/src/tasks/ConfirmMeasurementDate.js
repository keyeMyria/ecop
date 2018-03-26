import React, { Component } from 'react'
import { withStyles } from 'material-ui/styles'

const styles = {}

class ConfirmMeasurementDate extends Component {
  render = () => {
    const { classes } = this.props

    return <div> The ConfirmMeasurementDate Form</div>
  }
}

export default withStyles(styles)(ConfirmMeasurementDate)
