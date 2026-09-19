import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Container,
  Paper,
  Divider,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { apiFetch } from "../utils/api";

function Login() {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.user_id);

      if (data.role === "admin") navigate("/admin-dashboard");
      else if (data.role === "owner" || data.role === "manager") navigate("/owner-dashboard");
      else if (data.role === "driver") navigate("/driver-portal");
    } catch (err) {
      setError(err.message || "Network error. Is the backend running?");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        {/* Logo */}
        <Box display="flex" alignItems="center" justifyContent="center" mb={3} gap={1}>
          <LocalShippingIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight={800} color="primary" letterSpacing={1}>
            FLEETER
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: "divider" }}>
          <Typography variant="h5" fontWeight={700} mb={0.5}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Sign in to your Fleeter account.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            <TextField
              name="identifier"
              label="Email or Username"
              value={formData.identifier}
              onChange={handleChange}
              required
              fullWidth
              autoComplete="username"
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
            <Button type="submit" variant="contained" size="large" fullWidth>
              Sign In
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" display="inline">
              Don't have an account?{" "}
            </Typography>
            <Link to="/register" style={{ textDecoration: "none" }}>
              <Typography variant="body2" fontWeight={700} color="primary" display="inline">
                Create one
              </Typography>
            </Link>
          </Box>
        </Paper>

        <Box textAlign="center" mt={2}>
          <Button onClick={() => navigate("/")} size="small" color="inherit">
            ← Back to Home
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default Login;
