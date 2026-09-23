import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Stack,
  Link,
  IconButton,
  Tooltip,
  Divider,
  Avatar,
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LoginIcon from "@mui/icons-material/Login";
import MapIcon from "@mui/icons-material/Map";
import BarChartIcon from "@mui/icons-material/BarChart";
import LockIcon from "@mui/icons-material/Lock";
import { apiFetch } from "../utils/api";
import { useThemeSettings } from "../context/ThemeSettingsContext";

const highlights = [
  { icon: <MapIcon fontSize="small" />, label: "Live GPS Tracking" },
  { icon: <BarChartIcon fontSize="small" />, label: "Fleet Analytics" },
  { icon: <LockIcon fontSize="small" />, label: "Role-Based Portals" },
];

function Login() {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeSettings();
  const isDark = mode === "dark";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.user_id);

      if (data.role === "admin") navigate("/admin-dashboard");
      else if (data.role === "owner" || data.role === "manager")
        navigate("/owner-dashboard");
      else if (data.role === "driver") navigate("/driver-portal");
    } catch (err) {
      setError(err.message || "Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* ─── Left: Brand Panel ─── */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: "0 0 420px",
          flexDirection: "column",
          justifyContent: "space-between",
          p: 6,
          position: "relative",
          overflow: "hidden",
          background: isDark
            ? "linear-gradient(160deg, #0a1628 0%, #0d2040 50%, #0a1628 100%)"
            : "linear-gradient(160deg, #1e3a5f 0%, #1d4ed8 100%)",
          borderRight: "1px solid",
          borderColor: isDark ? "#1a2d4a" : "transparent",
        }}
      >
        {/* Ambient glows */}
        <Box
          sx={{
            position: "absolute",
            top: "15%",
            left: "10%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "20%",
            right: "5%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Link
            component={RouterLink}
            to="/"
            underline="none"
            sx={{ display: "inline-block" }}
          >
            <Typography
              variant="h4"
              fontWeight={1000}
              letterSpacing={2}
              sx={{
                fontFamily: '"Passero One", cursive',
                color: "#60a5fa",
                cursor: "pointer",
              }}
            >
              FLEETER
            </Typography>
          </Link>
        </Box>

        {/* Hero text */}
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h4"
            fontWeight={900}
            sx={{
              color: "#fff",
              lineHeight: 1.1,
              mb: 2,
              letterSpacing: "-0.02em",
            }}
          >
            Your fleet,
            <br />
            <Box component="span" sx={{ color: "#60a5fa" }}>
              always in control.
            </Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "rgba(255,255,255,0.65)", mb: 4, lineHeight: 1.7 }}
          >
            Real-time intelligence for modern fleet operations.
          </Typography>

          <Stack spacing={2}>
            {highlights.map((h) => (
              <Box
                key={h.label}
                sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "rgba(255,255,255,0.1)",
                    color: "#60a5fa",
                    borderRadius: 2,
                  }}
                >
                  {h.icon}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}
                >
                  {h.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: "rgba(255,255,255,0.35)",
            position: "relative",
            zIndex: 1,
          }}
        >
          © {new Date().getFullYear()} Fleeter Transport Management
        </Typography>
      </Box>

      {/* ─── Right: Form Panel ─── */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, md: 4 },
          position: "relative",
        }}
      >
        {/* Theme toggle */}
        <Box sx={{ position: "absolute", top: 24, right: 24 }}>
          <Tooltip title={isDark ? "Light Mode" : "Dark Mode"}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                borderRadius: 2,
                color: "text.secondary",
              }}
            >
              {isDark ? (
                <LightModeIcon fontSize="small" />
              ) : (
                <DarkModeIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ width: "100%", maxWidth: 400 }}>
          {/* Mobile logo */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              mb: 3,
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={800}
              letterSpacing={2}
              sx={{
                fontFamily: '"Passero One", cursive',
                background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              FLEETER
            </Typography>
          </Box>

          <Typography
            variant="h5"
            fontWeight={900}
            mb={0}
            sx={{ letterSpacing: "-0.02em" }}
          >
            Welcome back
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Sign in to your Fleeter account to continue.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ my: 3 }}>
            <Stack spacing={1.5}>
              <TextField
                name="identifier"
                label="Email or Username"
                value={formData.identifier}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="username"
                autoFocus
              />
              <TextField
                type="password"
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="current-password"
              />
              <Button
                type="submit"
                variant="contained"
                size="medium"
                fullWidth
                disabled={loading}
                startIcon={<LoginIcon />}
                sx={{ py: 1, fontWeight: 700, fontSize: "0.95rem" }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 4 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              OR
            </Typography>
          </Divider>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Don't have an account?{" "}
              <Link
                component={RouterLink}
                to="/register"
                underline="hover"
                color="primary.light"
                fontWeight={700}
              >
                Create one free
              </Link>
            </Typography>
            <Link
              component={RouterLink}
              to="/"
              underline="hover"
              color="text.secondary"
              variant="body2"
            >
              ← Back to Home
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Login;
