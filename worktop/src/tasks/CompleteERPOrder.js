import React, { Component, Fragment } from 'react'

import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Paper from '@material-ui/core/Paper'
import indigo from '@material-ui/core/colors/indigo'

import FileUploader from 'widget/FileUploader'

const styles = theme => ({
  hint: {
    padding: theme.spacing.unit * 2,
    backgroundColor: indigo[50]
  },
  hintText: {
    color: indigo[900],
    lineHeight: '2em'
  },
  orderId: {
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    ...theme.custom.orderId
  }
})

class CompleteERPOrder extends Component {
  submitForm = () => {
    this.props.submitForm({ orderId: this.props.variables.orderId })
  }

  render = () => {
    const { classes, variables } = this.props

    return (
      <Fragment>
        <FileUploader
          label="原始订单"
          fullWidth
          margin="normal"
          allowUpload={false}
          allowDelete={false}
          initiallyExpanded={false}
          InputLabelProps={{
            shrink: true
          }}
          value={variables.orderFile}
        />

        <FileUploader
          label="安装文件"
          fullWidth
          margin="normal"
          allowUpload={false}
          allowDelete={false}
          InputLabelProps={{
            shrink: true
          }}
          value={variables.installationFile}
        />

        <Paper className={classes.hint}>
          <Typography variant="subheading" className={classes.hintText}>
            请在大管家ERP完成销售订单
            <span className={classes.orderId}>{variables.orderId}</span>
            以及相应采购订单，然后直接提交任务。
          </Typography>
        </Paper>
      </Fragment>
    )
  }
}

export default withStyles(styles)(CompleteERPOrder)
