import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0284c7", // matches your existing brand blue from Landing.jsx
    },
    secondary: {
      main: "#2c3e50", // your existing sidebar/navbar dark slate
    },
    error: {
      main: "#e74c3c",
    },
    success: {
      main: "#2ecc71",
    },
    warning: {
      main: "#f39c12",
    },
    background: {
      default: "#f4f7f6",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiInputLabel: {
      defaultProps: {
        shrink: true,
      },
    },
    MuiTextField: {
      defaultProps: {
        InputLabelProps: { shrink: true },
      },
    },
  },
});

export default theme;
