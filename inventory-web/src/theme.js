import { createTheme } from "@mui/material"

const theme = createTheme({
    palette: {
    primary: {
      main: '#1976d2', // A custom deep blue
    //   light: '#42a5f5', // MUI can calculate these or you can define them
    //   dark: '#115293',
    //   contrastText: '#fff',
    },
    secondary: {
      main: '#dc004e',
      text: '#839211' // A custom red/pink
    },
    // You can define other palette colors: error, warning, info, success, background, text
  },
  typography: {
    fontFamily: 'Roboto, sans-serif', // Default font for your app
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
    },
    button: {
      fontSize: '1rem', // Make all buttons slightly larger
      textTransform: 'none', // Prevent MUI from making button text uppercase by default
    },
  },
  spacing: 8, // Default spacing unit is 8px. theme.spacing(1) = 8px, theme.spacing(2) = 16px etc.
  shape: {
    borderRadius: 8, // Make all rounded corners a bit more rounded
  },
  // You can also override default props or styles for specific components globally:
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true, // Disable shadow on all buttons by default
      },
      styleOverrides: {
        root: {
          // You can write CSS here that applies to all buttons
          // For example, if you wanted a specific border on all buttons
          // border: '1px solid black',
        },
      },
    },
    // MuiAppBar, MuiTextField, etc.
  }
})
export default theme