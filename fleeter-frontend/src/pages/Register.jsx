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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { apiFetch } from "../utils/api";

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
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
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
            Create an Account
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Start managing your fleet today.
          </Typography>

          {message && (
            <Alert severity={isSuccess ? "success" : "error"} sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            {(formData.role === "driver" || formData.role === "manager") && (
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                <TextField
                  name="firstName"
                  label="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  fullWidth
                  autoComplete="given-name"
                />
                <TextField
                  name="lastName"
                  label="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  fullWidth
                  autoComplete="family-name"
                />
              </Box>
            )}
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
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                label="Role"
                onChange={handleChange}
              >
                <MenuItem value="driver">Driver</MenuItem>
                <MenuItem value="manager">Manager / Dispatcher</MenuItem>
                <MenuItem value="owner">Fleet Owner</MenuItem>
              </Select>
            </FormControl>

            <Button type="submit" variant="contained" size="large" fullWidth>
              Sign Up
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" display="inline">
              Already have an account?{" "}
            </Typography>
            <Link to="/login" style={{ textDecoration: "none" }}>
              <Typography variant="body2" fontWeight={700} color="primary" display="inline">
                Sign In
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

export default Register;
