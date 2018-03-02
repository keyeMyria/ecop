import createMuiTheme from 'material-ui/styles/createMuiTheme'
import blue from 'material-ui/colors/blue'
import pink from 'material-ui/colors/pink'


const theme = createMuiTheme({
  // for correctly showing title bar
  viewport: {
    overflowY: 'auto'
  },

  palette: {
    primary: {
      light: blue[300],
      main: blue[500],
      dark: blue[700]
    },
    secondary: {
      light: pink[300],
      main: pink[500],
      dark: pink[700]
    },
    type: 'light'
  },
  typography: {
    fontFamily: 'tahoma, arial, "微软雅黑"'
  }
})

export default theme
