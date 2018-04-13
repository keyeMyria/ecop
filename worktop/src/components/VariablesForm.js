import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { withStyles } from 'material-ui/styles'
import AppBar from 'material-ui/AppBar'
import Dialog from 'material-ui/Dialog'
import Toolbar from 'material-ui/Toolbar'
import Typography from 'material-ui/Typography'
import IconButton from 'material-ui/IconButton'
import CloseIcon from '@material-ui/icons/Close'
import WorkIcon from '@material-ui/icons/Work'

import { jsonrpc } from 'homemaster-jslib'
import OrderHeader from 'components/OrderHeader'
import FileUploader from 'widget/FileUploader'

const styles = theme => ({
  paperWidthSm: {
    width: 700,
    maxWidth: 700
  },
  appbar: {
    position: 'relative'
  },
  toolbar: {
    paddingRight: 0,
    paddingLeft: 16
  },
  title: {
    flex: 1,
    marginLeft: 16
  },
  content: {
    paddingBottom: 16,
    overflowY: 'auto',
    maxHeight: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
    [theme.breakpoints.up('sm')]: {
      maxHeight: `calc(100vh - ${
        theme.mixins.toolbar[theme.breakpoints.up('sm')].minHeight
      }px)`
    }
  },
  form: {
    paddingLeft: 16,
    paddingRight: 16
  }
})

class VariablesForm extends Component {
  state = {
    variables: null
  }

  componentWillReceiveProps = nextProps => {
    if (nextProps.processInstanceId) {
      jsonrpc({
        method: 'bpmn.variable.get',
        params: [nextProps.processInstanceId]
      }).then(variables => {
        this.setState({ variables })
      })
    }
  }

  render() {
    const { classes, processInstanceId, ...other } = this.props
    const { variables } = this.state

    if (!variables) {
      return null
    } else {
      const {
        measurementFile,
        orderFile,
        productionDrawing,
        installationFile
      } = variables

      return (
        <Dialog classes={{ paperWidthSm: classes.paperWidthSm }} {...other}>
          <AppBar className={classes.appbar}>
            <Toolbar className={classes.toolbar}>
              <WorkIcon />
              <Typography
                variant="title"
                color="inherit"
                className={classes.title}
              >
                订单信息
              </Typography>
              <IconButton color="inherit" onClick={other.onClose}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          <div className={classes.content}>
            <OrderHeader variables={variables} />

            <div className={classes.form}>
              <FileUploader
                label="原始订单"
                fullWidth
                margin="normal"
                allowUpload={false}
                allowDelete={false}
                InputLabelProps={{
                  shrink: true
                }}
                value={orderFile}
              />

              {measurementFile && (
                <FileUploader
                  label="测量文件"
                  fullWidth
                  margin="normal"
                  allowUpload={false}
                  allowDelete={false}
                  InputLabelProps={{
                    shrink: true
                  }}
                  value={variables.measurementFile}
                />
              )}

              {productionDrawing && (
                <FileUploader
                  label="生产图纸"
                  fullWidth
                  margin="normal"
                  allowUpload={false}
                  allowDelete={false}
                  InputLabelProps={{
                    shrink: true
                  }}
                  value={variables.productionDrawing}
                />
              )}

              {installationFile && (
                <FileUploader
                  label="安装文件"
                  fullWidth
                  margin="normal"
                  allowUpload={false}
                  allowDelete={false}
                  InputLabelProps={{
                    shrink: true
                  }}
                  value={installationFile}
                />
              )}
            </div>
          </div>
        </Dialog>
      )
    }
  }
}

VariablesForm.propTypes = {
  /**
   *　Called when the task dialog is requested to be closed
   */
  onClose: PropTypes.func.isRequired,
  /**
   *　Whether the form shall be shown
   */
  open: PropTypes.bool.isRequired,

  processInstanceId: PropTypes.string
}

export default withStyles(styles)(VariablesForm)
