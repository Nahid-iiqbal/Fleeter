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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { apiFetch } from "../utils/api";
import { useThemeSettings } from "../context/ThemeSettingsContext";

const perks = [
  "Free forever for small fleets",
  "Real-time GPS for every vehicle",
  "Document & maintenance alerts",
  "Secure role-based access",
];

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    role: "driver",
  });
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeSettings();
  const isDark = mode === "dark";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setIsSuccess(true);
      setMessage("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.message || "Network error. Is the backend running?");
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
          flex: "0 0 400px",
          flexDirection: "column",
          justifyContent: "space-between",
          p: 6,
          position: "relative",
          overflow: "hidden",
          background: isDark
            ? "linear-gradient(160deg, #0a1628 0%, #081530 50%, #0b1f3d 100%)"
            : "linear-gradient(160deg, #1e3a5f 0%, #065f46 100%)",
          borderRight: "1px solid",
          borderColor: isDark ? "#1a2d4a" : "transparent",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "20%",
            right: "5%",
            width: 250,
            height: 250,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "15%",
            left: "5%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
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
                color: "#34d399",
                cursor: "pointer",
              }}
            >
              FLEETER
            </Typography>
          </Link>
        </Box>
        {/* Hero text */}
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ElectricBoltIcon sx={{ color: "#34d399", fontSize: 20 }} />
            <Typography
              variant="caption"
              sx={{
                color: "#34d399",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Get started free
            </Typography>
          </Box>
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
            Join the smarter
            <br />
            <Box component="span" sx={{ color: "#34d399" }}>
              fleet revolution.
            </Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "rgba(255,255,255,0.6)", mb: 4, lineHeight: 1.7 }}
          >
            Set up your fleet in minutes and gain instant visibility across all
            vehicles and drivers.
          </Typography>

          <Stack spacing={2}>
            {perks.map((p) => (
              <Box
                key={p}
                sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
              >
                <CheckCircleIcon sx={{ color: "#34d399", fontSize: 18 }} />
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}
                >
                  {p}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: "rgba(255,255,255,0.3)",
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
          overflowY: "auto",
        }}
      >
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

        <Box sx={{ width: "100%", maxWidth: 440, py: { xs: 4, md: 0 } }}>
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
            <Link component={RouterLink} to="/" underline="none">
              <Typography
                variant="h4"
                fontWeight={1000}
                letterSpacing={2}
                sx={{
                  fontFamily: '"Passero One", cursive',
                  background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  cursor: "pointer",
                }}
              >
                FLEETER
              </Typography>
            </Link>
          </Box>

          <Typography
            variant="h5"
            fontWeight={900}
            sx={{ letterSpacing: "-0.02em" }}
          >
            Create an account
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Start managing your fleet today. It's free.
          </Typography>

          {message && (
            <Alert severity={isSuccess ? "success" : "error"} sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    name="firstName"
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    fullWidth
                  />
                  <TextField
                    name="lastName"
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    fullWidth
                  />
                </Stack>
              <TextField
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="username"
              />
              <TextField
                type="email"
                name="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="email"
              />
              <TextField
                type="password"
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="new-password"
              />
              <FormControl fullWidth>
                <InputLabel>I am a...</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="I am a..."
                  onChange={handleChange}
                >
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="manager">Manager / Dispatcher</MenuItem>
                  <MenuItem value="owner">Fleet Owner</MenuItem>
                </Select>
              </FormControl>
              <Button
                type="submit"
                variant="contained"
                size="medium"
                fullWidth
                disabled={loading || isSuccess}
                startIcon={<PersonAddIcon />}
                sx={{ py: 1, fontWeight: 700, fontSize: "0.95rem" }}
              >
                {loading && !isSuccess
                  ? "Creating Account..."
                  : "Create Account"}
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
              Already have an account?{" "}
              <Link
                component={RouterLink}
                to="/login"
                underline="hover"
                color="primary.light"
                fontWeight={700}
              >
                Sign In
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

export default Register;
