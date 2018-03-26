import React, { Component } from 'react'
import { withStyles } from 'material-ui/styles'

const styles = {
  root: {
    padding: 16
  }
}

class TakeMeasurement extends Component {
  render = () => {
    const { classes } = this.props

    return <div className={classes.root} />
  }
}

export default withStyles(styles)(TakeMeasurement)
