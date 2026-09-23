import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { apiFetch } from "../utils/api";

const ThemeSettingsContext = createContext();

export const useThemeSettings = () => useContext(ThemeSettingsContext);

export const ThemeSettingsProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    // Read from localStorage immediately to prevent flash
    const stored = localStorage.getItem("theme");
    // Default to dark — only use light if explicitly stored
    return stored === "light" ? "light" : "dark";
  });
  const [notifications, setNotifications] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch("/api/auth/account");
      const serverTheme = data.theme || "dark";
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

  const setSettings = (newTheme, newNotifs) => {
    if (newTheme !== undefined) {
      setMode(newTheme);
      localStorage.setItem("theme", newTheme);
    }
    if (newNotifs !== undefined) {
      setNotifications(newNotifs);
    }
  };

  const toggleTheme = () => {
    const newTheme = mode === "dark" ? "light" : "dark";
    setMode(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#3b82f6",
            light: "#60a5fa",
            dark: "#2563eb",
            contrastText: "#ffffff",
          },
          secondary: {
            main: "#10b981",
            light: "#34d399",
            dark: "#059669",
            contrastText: "#ffffff",
          },
          error: { main: "#f87171", light: "#fca5a5", dark: "#dc2626" },
          success: { main: "#34d399", light: "#6ee7b7", dark: "#10b981" },
          warning: { main: "#fbbf24", light: "#fcd34d", dark: "#d97706" },
          info: { main: "#60a5fa", light: "#93c5fd", dark: "#3b82f6" },
          background: {
            default: mode === "light" ? "#f0f4f8" : "#080d16",
            paper: mode === "light" ? "#ffffff" : "#0f1929",
          },
          text: {
            primary: mode === "light" ? "#0f172a" : "#e2eeff",
            secondary: mode === "light" ? "#475569" : "#7ca0c8",
            disabled: mode === "light" ? "#94a3b8" : "#3d5a7a",
          },
          divider: mode === "light" ? "#e2e8f0" : "#1a2d4a",
          action: {
            hover:
              mode === "dark"
                ? "rgba(59,130,246,0.07)"
                : "rgba(59,130,246,0.05)",
            selected:
              mode === "dark"
                ? "rgba(59,130,246,0.15)"
                : "rgba(59,130,246,0.1)",
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 800, letterSpacing: "-0.02em" },
          h2: { fontWeight: 800, letterSpacing: "-0.02em" },
          h3: { fontWeight: 700, letterSpacing: "-0.01em" },
          h4: { fontWeight: 700, letterSpacing: "-0.01em" },
          h5: { fontWeight: 700 },
          h6: { fontWeight: 700 },
          subtitle1: { fontWeight: 600 },
          button: { fontWeight: 600, letterSpacing: "0.01em" },
        },
        shape: { borderRadius: 12 },
        shadows: [
          "none",
          mode === "dark"
            ? "0 1px 3px rgba(0,0,0,0.5)"
            : "0 1px 3px rgba(0,0,0,0.08)",
          mode === "dark"
            ? "0 4px 12px rgba(0,0,0,0.5)"
            : "0 4px 12px rgba(0,0,0,0.08)",
          mode === "dark"
            ? "0 8px 24px rgba(0,0,0,0.6)"
            : "0 8px 24px rgba(0,0,0,0.1)",
          mode === "dark"
            ? "0 16px 48px rgba(0,0,0,0.7)"
            : "0 16px 48px rgba(0,0,0,0.14)",
          ...Array(20).fill("none"),
        ],
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              "*": {
                scrollbarWidth: "thin",
                scrollbarColor:
                  mode === "dark"
                    ? "#1a2d4a transparent"
                    : "#cbd5e1 transparent",
              },
              "*::-webkit-scrollbar": { width: "6px", height: "6px" },
              "*::-webkit-scrollbar-track": { background: "transparent" },
              "*::-webkit-scrollbar-thumb": {
                background: mode === "dark" ? "#1a2d4a" : "#cbd5e1",
                borderRadius: "99px",
              },
              "*::-webkit-scrollbar-thumb:hover": {
                background: mode === "dark" ? "#2a3f5f" : "#94a3b8",
              },
              body: {
                backgroundImage:
                  mode === "dark"
                    ? "radial-gradient(ellipse at 20% 20%, rgba(59,130,246,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.03) 0%, transparent 60%)"
                    : "none",
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: mode === "dark" ? "#0a1628" : "#ffffff",
                borderRight:
                  mode === "dark" ? "1px solid #1a2d4a" : "1px solid #e2e8f0",
                backgroundImage: "none",
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor:
                  mode === "dark"
                    ? "rgba(8,13,22,0.85)"
                    : "rgba(255,255,255,0.85)",
                backdropFilter: "blur(16px)",
                boxShadow: "none",
                borderBottom:
                  mode === "dark" ? "1px solid #1a2d4a" : "1px solid #e2e8f0",
                color: mode === "dark" ? "#e2eeff" : "#0f172a",
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                backgroundColor: mode === "dark" ? "#0f1929" : "#ffffff",
                border:
                  mode === "dark" ? "1px solid #1a2d4a" : "1px solid #e2e8f0",
                transition: "border-color 0.2s, box-shadow 0.2s",
                "&:hover": {
                  borderColor: mode === "dark" ? "#2a4a7f" : "#bfdbfe",
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                backgroundColor: mode === "dark" ? "#0f1929" : "#ffffff",
              },
              elevation1: {
                boxShadow:
                  mode === "dark"
                    ? "0 2px 8px rgba(0,0,0,0.4)"
                    : "0 2px 8px rgba(0,0,0,0.06)",
              },
              elevation3: {
                boxShadow:
                  mode === "dark"
                    ? "0 8px 32px rgba(0,0,0,0.5)"
                    : "0 8px 32px rgba(0,0,0,0.1)",
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                margin: "2px 8px",
                width: "calc(100% - 16px)",
                transition: "all 0.15s ease",
                "&.Mui-selected": {
                  backgroundColor: "rgba(59,130,246,0.15)",
                  color: "#60a5fa",
                  borderLeft: "3px solid #3b82f6",
                  paddingLeft: "13px",
                  "& .MuiListItemIcon-root": { color: "#3b82f6" },
                  "&:hover": {
                    backgroundColor: "rgba(59,130,246,0.2)",
                  },
                },
                "&:hover": {
                  backgroundColor:
                    mode === "dark"
                      ? "rgba(59,130,246,0.07)"
                      : "rgba(59,130,246,0.05)",
                },
              },
            },
          },
          MuiListItemIcon: {
            styleOverrides: {
              root: {
                color: mode === "dark" ? "#7ca0c8" : "#64748b",
                minWidth: 40,
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 10,
                transition: "all 0.2s ease",
              },
              containedPrimary: {
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow:
                  mode === "dark"
                    ? "0 4px 15px rgba(59,130,246,0.35)"
                    : "0 4px 12px rgba(59,130,246,0.25)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                  boxShadow:
                    mode === "dark"
                      ? "0 6px 20px rgba(59,130,246,0.5)"
                      : "0 6px 18px rgba(59,130,246,0.35)",
                  transform: "translateY(-1px)",
                },
              },
              containedSecondary: {
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                boxShadow:
                  mode === "dark"
                    ? "0 4px 15px rgba(16,185,129,0.35)"
                    : "0 4px 12px rgba(16,185,129,0.25)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
                  transform: "translateY(-1px)",
                },
              },
              outlinedPrimary: {
                borderColor: mode === "dark" ? "#2a4a7f" : "#bfdbfe",
                "&:hover": {
                  borderColor: "#3b82f6",
                  backgroundColor: "rgba(59,130,246,0.08)",
                },
              },
            },
          },
          MuiTextField: {
            defaultProps: { variant: "outlined" },
            styleOverrides: {
              root: {
                "& .MuiOutlinedInput-root": {
                  borderRadius: 10,
                  "& fieldset": {
                    borderColor: mode === "dark" ? "#1a2d4a" : "#e2e8f0",
                    transition: "border-color 0.2s",
                  },
                  "&:hover fieldset": {
                    borderColor: mode === "dark" ? "#2a4a7f" : "#93c5fd",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                    borderWidth: 2,
                  },
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 600,
                borderRadius: 8,
              },
              colorPrimary: {
                backgroundColor:
                  mode === "dark" ? "rgba(59,130,246,0.15)" : "#dbeafe",
                color: mode === "dark" ? "#60a5fa" : "#1d4ed8",
              },
              colorSuccess: {
                backgroundColor:
                  mode === "dark" ? "rgba(16,185,129,0.15)" : "#d1fae5",
                color: mode === "dark" ? "#34d399" : "#065f46",
              },
              colorWarning: {
                backgroundColor:
                  mode === "dark" ? "rgba(251,191,36,0.15)" : "#fef3c7",
                color: mode === "dark" ? "#fbbf24" : "#92400e",
              },
              colorError: {
                backgroundColor:
                  mode === "dark" ? "rgba(248,113,113,0.15)" : "#fee2e2",
                color: mode === "dark" ? "#f87171" : "#991b1b",
              },
            },
          },
          MuiTableHead: {
            styleOverrides: {
              root: {
                "& .MuiTableCell-head": {
                  backgroundColor: mode === "dark" ? "#0a1628" : "#f8fafc",
                  color: mode === "dark" ? "#7ca0c8" : "#64748b",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  borderBottom:
                    mode === "dark" ? "1px solid #1a2d4a" : "1px solid #e2e8f0",
                },
              },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                "&:hover": {
                  backgroundColor:
                    mode === "dark"
                      ? "rgba(59,130,246,0.04)"
                      : "rgba(59,130,246,0.02)",
                },
                "& .MuiTableCell-body": {
                  borderBottom:
                    mode === "dark" ? "1px solid #1a2d4a" : "1px solid #f1f5f9",
                },
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                backgroundColor: mode === "dark" ? "#1e3050" : "#1e293b",
                fontSize: "0.75rem",
                fontWeight: 500,
                borderRadius: 8,
                padding: "6px 12px",
              },
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                fontWeight: 500,
              },
              standardError: {
                backgroundColor:
                  mode === "dark" ? "rgba(248,113,113,0.1)" : "#fee2e2",
                border:
                  mode === "dark"
                    ? "1px solid rgba(248,113,113,0.2)"
                    : "1px solid #fca5a5",
              },
              standardWarning: {
                backgroundColor:
                  mode === "dark" ? "rgba(251,191,36,0.1)" : "#fef3c7",
                border:
                  mode === "dark"
                    ? "1px solid rgba(251,191,36,0.2)"
                    : "1px solid #fcd34d",
              },
              standardSuccess: {
                backgroundColor:
                  mode === "dark" ? "rgba(52,211,153,0.1)" : "#d1fae5",
                border:
                  mode === "dark"
                    ? "1px solid rgba(52,211,153,0.2)"
                    : "1px solid #6ee7b7",
              },
            },
          },
          MuiDivider: {
            styleOverrides: {
              root: {
                borderColor: mode === "dark" ? "#1a2d4a" : "#e2e8f0",
              },
            },
          },
          MuiSwitch: {
            styleOverrides: {
              root: {
                "& .MuiSwitch-track": {
                  backgroundColor: mode === "dark" ? "#1a2d4a" : "#cbd5e1",
                },
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeSettingsContext.Provider
      value={{ mode, notifications, setSettings, fetchSettings, toggleTheme }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeSettingsContext.Provider>
  );
};
