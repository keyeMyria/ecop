import createMuiTheme from '@material-ui/core/styles/createMuiTheme'
import blue from '@material-ui/core/colors/blue'
import pink from '@material-ui/core/colors/pink'

const theme = createMuiTheme({
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
    fontFamily: '"roboto", "Helvetica", "Arial", "微软雅黑"'
  },
  viewport: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  custom: {
    orderId: {
      fontSize: 24,
      fontWeight: 'bold'
    },
    submitButton: {
      marginTop: 12,
      width: '50%'
    },
    buttonRow: {
      textAlign: 'center'
    },
    buttonIcon: {
      marginRight: 10
    }
  }
})

export default theme
