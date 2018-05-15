/* global App */
import React from 'react'
import classNames from 'classnames'
import screenfull from 'screenfull'

import { withStyles } from 'material-ui/styles'
import Drawer from 'material-ui/Drawer'
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar'
import List from 'material-ui/List'
import { ListItem, ListItemIcon, ListItemText } from 'material-ui/List'
import Typography from 'material-ui/Typography'
import Divider from 'material-ui/Divider'
import Tooltip from 'material-ui/Tooltip'
import IconButton from 'material-ui/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import AddCircleIcon from '@material-ui/icons/AddCircle'
import LocalShipping from '@material-ui/icons/LocalShipping'
import WorkIcon from '@material-ui/icons/Work'
import FullScreenIcon from '@material-ui/icons/Fullscreen'
import FullScreenExitIcon from '@material-ui/icons/FullscreenExit'
import MoneyIcon from '@material-ui/icons/MonetizationOn'

import { jsonrpc } from 'homemaster-jslib'
import TaskListIcon from 'homemaster-jslib/svg-icons/TaskList'

import { hasPermission } from 'permission'
import StartForm from './StartForm'
import TaskList from './TaskList'
import ShipmentForm from './ShipmentForm'
import ProcessManager from './ProcessManager'

const drawerWidth = 180
const drawerWidthClose = 72

const styles = theme => ({
  root: {
    position: 'relative',
    display: 'flex'
  },
  appName: {
    paddingLeft: theme.spacing.unit
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 26
  },
  hide: {
    display: 'none'
  },
  drawerPaper: {
    position: 'relative',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    width: drawerWidthClose,
    [theme.breakpoints.down('sm')]: {
      width: 0
    }
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    ...theme.mixins.toolbar
  },
  spacer: {
    flex: 1
  },
  main: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    // below is required for IE11 due to is bug of flexbox model
    '&.open': {
      width: `calc(100% - ${drawerWidth}px)`
    },
    '&.close': {
      width: `calc(100% - ${drawerWidthClose}px)`
    }
  },
  content: {
    overflowY: 'auto',
    padding: theme.spacing.unit,
    height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing.unit * 2,
      height: `calc(100vh - ${
        theme.mixins.toolbar[theme.breakpoints.up('sm')].minHeight
      }px)`
    }
  },
  listItemText: {
    whiteSpace: 'nowrap'
  }
})

class AppFrame extends React.Component {
  state = {
    drawerOpen: false,
    currentFrame: hasPermission('task.view') ? 'tasks' : 'process',
    isFullscreen: false
  }

  handleDrawerOpen = () => {
    this.setState({ drawerOpen: true })
  }

  handleDrawerClose = () => {
    this.setState({ drawerOpen: false })
  }

  handleLogout = () => {
    jsonrpc({
      method: 'auth.logout',
      success: () => {
        window.location.reload()
      }
    })
  }

  render() {
    const { classes } = this.props
    const { currentFrame, drawerOpen } = this.state

    let MenuItem = props => {
      const { icon, text, onClick, ...other } = props
      return (
        <ListItem button onClick={onClick} {...other}>
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText className={classes.listItemText} primary={text} />
        </ListItem>
      )
    }

    const FullscreenToggle = () =>
      screenfull.enabled && (
        <IconButton
          color="inherit"
          onClick={() => {
            this.setState({ isFullscreen: !this.state.isFullscreen })
            screenfull.toggle()
          }}
        >
          {this.state.isFullscreen ? (
            <Tooltip title="退出全屏">
              <FullScreenExitIcon />
            </Tooltip>
          ) : (
            <Tooltip title="全屏显示">
              <FullScreenIcon />
            </Tooltip>
          )}
        </IconButton>
      )

    return (
      <div className={classes.root}>
        <AppBar
          position="absolute"
          className={classNames(
            classes.appBar,
            drawerOpen && classes.appBarShift
          )}
        >
          <Toolbar disableGutters={!drawerOpen}>
            <IconButton
              color="inherit"
              onClick={this.handleDrawerOpen}
              className={classNames(
                classes.menuButton,
                drawerOpen && classes.hide
              )}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="title" color="inherit">
              台面安装流程
            </Typography>
            <div className={classes.spacer} />
            <FullscreenToggle />
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          classes={{
            paper: classNames(
              classes.drawerPaper,
              !drawerOpen && classes.drawerPaperClose
            )
          }}
          open={drawerOpen}
        >
          <div className={classes.toolbar}>
            <div className={classes.appName}>
              <Typography variant="title" color="inherit">
                Worktop
              </Typography>
              <Typography variant="subheading" color="inherit">
                v1.2_{App.version}
              </Typography>
            </div>
            <IconButton onClick={this.handleDrawerClose}>
              <ChevronLeftIcon />
            </IconButton>
          </div>
          <Divider />
          <List>
            {hasPermission('order.start') && (
              <MenuItem
                icon={<AddCircleIcon />}
                text="新增订单"
                title="新增订单"
                onClick={() => this.setState({ currentFrame: 'start' })}
              />
            )}
            {hasPermission('task.view') && (
              <MenuItem
                icon={<WorkIcon />}
                text="我的任务"
                title="我的任务"
                onClick={() => this.setState({ currentFrame: 'tasks' })}
              />
            )}
            {hasPermission('shipment.send') && (
              <MenuItem
                icon={<LocalShipping />}
                text="工厂发货"
                title="工厂发货"
                onClick={() => this.setState({ currentFrame: 'shipping' })}
              />
            )}
            <MenuItem
              icon={<TaskListIcon />}
              text="订单查询"
              title="订单查询"
              onClick={() => this.setState({ currentFrame: 'process' })}
            />
            {// this is a temporarily link and only accessible by admin
            hasPermission('receivable.view') && (
              <ListItem
                button
                component="a"
                target="_blank"
                href={`/ikea/receivable/current.pdf?token=${App.csrfToken}`}
              >
                <ListItemIcon>
                  <MoneyIcon />
                </ListItemIcon>
                <ListItemText
                  className={classes.listItemText}
                  primary="倍宜对账"
                />
              </ListItem>
            )}
            <MenuItem
              icon={<ExitToAppIcon />}
              onClick={this.handleLogout}
              text="退出登录"
              title="退出登录"
            />
          </List>
        </Drawer>
        <div
          className={classNames([classes.main, drawerOpen ? 'open' : 'close'])}
        >
          <div className={classes.toolbar} />
          <div className={classes.content}>
            {currentFrame === 'start' && <StartForm />}
            {currentFrame === 'tasks' && <TaskList />}
            {currentFrame === 'shipping' && <ShipmentForm />}
            {currentFrame === 'process' && <ProcessManager />}
          </div>
        </div>
      </div>
    )
  }
}

export default withStyles(styles)(AppFrame)
