import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Container,
  Paper,
  Divider,
  Stack,
  Link,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { apiFetch } from "../utils/api";

function Login() {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      else if (data.role === "owner" || data.role === "manager") navigate("/owner-dashboard");
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
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container component="main" maxWidth="xs">
        {/* Logo */}
        <Box display="flex" alignItems="center" justifyContent="center" mb={4} gap={1}>
          <LocalShippingIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h4" fontWeight={800} color="primary" letterSpacing={1}>
            FLEETER
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box textAlign="center" mb={5}>
            <Typography variant="h5" fontWeight="bold" mb={1}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary" my={2}>
              Sign in to your Fleeter account.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3} sx={{ pt: 3 }}>
              <TextField
                variant="outlined"
                name="identifier"
                label="Email or Username"
                value={formData.identifier}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="username"
              />
              <TextField
                variant="outlined"
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
                size="large"
                fullWidth
                disableElevation
                disabled={loading}
                sx={{ py: 1.5, fontWeight: "bold", mt: 1 }}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{" "}
              <Link component={RouterLink} to="/register" underline="hover" color="primary" fontWeight="bold">
                Create one
              </Link>
            </Typography>
          </Box>
        </Paper>

        <Box textAlign="center" mt={3}>
          <Link
            component={RouterLink}
            to="/"
            underline="hover"
            color="text.secondary"
            variant="body2"
          >
            &larr; Back to Home
          </Link>
        </Box>
      </Container>
    </Box>
  );
}

export default Login;
