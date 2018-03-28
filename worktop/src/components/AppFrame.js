/* global App */
import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from 'material-ui/styles'
import classNames from 'classnames'
import Drawer from 'material-ui/Drawer'
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar'
import List from 'material-ui/List'
import { ListItem, ListItemIcon, ListItemText } from 'material-ui/List'
import Typography from 'material-ui/Typography'
import Divider from 'material-ui/Divider'
import IconButton from 'material-ui/IconButton'
import MenuIcon from 'material-ui-icons/Menu'
import ChevronLeftIcon from 'material-ui-icons/ChevronLeft'
import ExitToAppIcon from 'material-ui-icons/ExitToApp'
import AddCircleOutlineIcon from 'material-ui-icons/AddCircleOutline'
import LocalShipping from 'material-ui-icons/LocalShipping'

import { jsonrpc, screen } from 'homemaster-jslib'
import TaskListIcon from 'homemaster-jslib/svg-icons/TaskList'
import StartForm from './StartForm'
import TaskList from './TaskList'
import ShipmentForm from './ShipmentForm'

const drawerWidth = 180

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
    width: theme.spacing.unit * 9,
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
  main: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.default
  },
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: theme.spacing.unit,
    maxHeight: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing.unit * 2,
      maxHeight: `calc(100vh - ${
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
    drawerOpen: !screen.isMobile(),
    currentFrame: 'tasks'
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
      const { icon, text, onClick } = props
      return (
        <ListItem button onClick={onClick}>
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText className={classes.listItemText} primary={text} />
        </ListItem>
      )
    }

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
            <Typography variant="title" color="inherit" noWrap>
              台面安装流程
            </Typography>
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
              <Typography variant="title" color="inherit" noWrap>
                Worktop
              </Typography>
              <Typography variant="subheading" color="inherit" noWrap>
                v1.0.{App.version}
              </Typography>
            </div>
            <IconButton onClick={this.handleDrawerClose}>
              <ChevronLeftIcon />
            </IconButton>
          </div>
          <Divider />
          <List>
            <MenuItem
              icon={<AddCircleOutlineIcon />}
              text="新增订单"
              onClick={() => this.setState({ currentFrame: 'start' })}
            />
            <MenuItem
              icon={<TaskListIcon />}
              text="我的任务"
              onClick={() => this.setState({ currentFrame: 'tasks' })}
            />
            <MenuItem
              icon={<LocalShipping />}
              text="工厂发货"
              onClick={() => this.setState({ currentFrame: 'shipping' })}
            />
            <MenuItem
              icon={<ExitToAppIcon />}
              onClick={this.handleLogout}
              text="退出登录"
            />
          </List>
        </Drawer>
        <div className={classes.main}>
          <div className={classes.toolbar} />
          <div className={classes.content}>
            {currentFrame === 'start' && <StartForm />}
            {currentFrame === 'tasks' && <TaskList />}
            {currentFrame === 'shipping' && <ShipmentForm />}
          </div>
        </div>
      </div>
    )
  }
}

AppFrame.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(AppFrame)
