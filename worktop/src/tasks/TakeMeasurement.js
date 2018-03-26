import React, { Component } from 'react'
import { withStyles } from 'material-ui/styles'

const styles = {}

class TakeMeasurement extends Component {
  render = () => {
    const { classes } = this.props

    return <div>Measurement </div>
  }
}

export default withStyles(styles)(TakeMeasurement)
