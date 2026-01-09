// src/theme.js refactored
import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5', // Standardized for your Warehouse/Product pages
    },
    // SEMANTIC COLORS: Centralize your status colors here
    success: { main: '#2e7d32', light: '#4caf50' }, // Received
    warning: { main: '#ed6c02', light: '#ff9800' }, // Pending / Low Stock
    error: { main: '#d32f2f', light: '#ef5350' },   // Cancelled
    info: { main: '#0288d1', light: '#03a9f4' },    // Draft / Issued
    pending: {main: '#bc6c25'},
    
    background: {
      default: '#f8f9fa', // Neutral gray for the main screen background
      paper: '#ffffff',   // Pure white for Cards and Tables
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  spacing: 8, 
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }, // Subtle, modern shadow
      },
    },
  },
});

export default theme;