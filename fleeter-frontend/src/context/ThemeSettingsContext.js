import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { apiFetch } from "../utils/api";

const ThemeSettingsContext = createContext();

export const useThemeSettings = () => useContext(ThemeSettingsContext);

export const ThemeSettingsProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    // Read from localStorage immediately to prevent flash
    return localStorage.getItem("theme") === "dark" ? "dark" : "light";
  });
  const [notifications, setNotifications] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch("/api/auth/account");
      const serverTheme = data.theme || "light";
      setMode(serverTheme);
      setNotifications(data.notifications_enabled !== false);
      localStorage.setItem("theme", serverTheme);
    } catch (e) {
      // silently fall back to localStorage value
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchSettings();
    }
  }, []);

  const toggleTheme = () => {
    const targetMode = mode === "light" ? "dark" : "light";
    setMode(targetMode);
    localStorage.setItem("theme", targetMode);
  };

  const setSettings = (newTheme, newNotifs) => {
    setMode(newTheme);
    if (newTheme !== undefined) {
      setMode(newTheme);
      localStorage.setItem("theme", newTheme);
    }
    setNotifications(newNotifs);
    localStorage.setItem("theme", newTheme);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#0284c7",
            light: "#38bdf8",
            dark: "#0369a1",
          },
          secondary: {
            main: mode === "dark" ? "#334155" : "#2c3e50",
          },
          error: { main: "#e74c3c" },
          success: { main: "#2ecc71" },
          warning: { main: "#f39c12" },
          background: {
            default: mode === "light" ? "#f1f5f9" : "#0f172a",
            paper: mode === "light" ? "#ffffff" : "#1e293b",
          },
          text: {
            primary: mode === "light" ? "#0f172a" : "#f1f5f9",
            secondary: mode === "light" ? "#475569" : "#94a3b8",
          },
          divider: mode === "light" ? "#e2e8f0" : "#334155",
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 800 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 700 },
          h4: { fontWeight: 700 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        shape: {
          borderRadius: 10,
        },
        components: {
          MuiDrawer: {
            styleOverrides: {
              paper: ({ theme }) => ({
                backgroundColor: theme.palette.mode === "dark" ? "#1e293b" : "#ffffff",
                borderRight: `1px solid ${theme.palette.divider}`,
              }),
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: ({ theme }) => ({
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }),
            },
          },
          MuiCard: {
            styleOverrides: {
              root: ({ theme }) => ({
                backgroundImage: "none",
                border: `1px solid ${theme.palette.divider}`,
              }),
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: ({ theme }) => ({
                borderRadius: 8,
                margin: "2px 8px",
                width: "calc(100% - 16px)",
                "&.Mui-selected": {
                  backgroundColor: theme.palette.primary.main + "20",
                  color: theme.palette.primary.main,
                  "&:hover": {
                    backgroundColor: theme.palette.primary.main + "30",
                  },
                },
              }),
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                fontWeight: 600,
              },
              containedPrimary: {
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              },
            },
          },
          MuiTextField: {
            defaultProps: {
              variant: "outlined",
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeSettingsContext.Provider value={{ mode, toggleTheme, notifications, setSettings, fetchSettings }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeSettingsContext.Provider>
  );
};
