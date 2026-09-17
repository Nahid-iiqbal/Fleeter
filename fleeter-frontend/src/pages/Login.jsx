import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography, Alert, Container } from "@mui/material";
import { apiFetch } from "../utils/api";

function Login() {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
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
      console.error("Login request failed", err);
      setError(err.message || "Network error. Is the backend running?");
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Button onClick={() => navigate("/")} sx={{ mb: 2, ml: -1 }}>
        ← Back to Home
      </Button>

      <Typography variant="h5" component="h2" gutterBottom>
        Login to Fleeter
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          name="identifier"
          label="Email or Username"
          value={formData.identifier}
          onChange={handleChange}
          required
          fullWidth
        />

        <TextField
          type="password"
          name="password"
          label="Password"
          value={formData.password}
          onChange={handleChange}
          required
          fullWidth
        />

        <Button type="submit" variant="contained" size="large">
          Login
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Typography variant="body2">Don't have an account?</Typography>
        <Link to="/register" style={{ textDecoration: "none" }}>
          <Typography variant="body2" fontWeight="bold" color="primary">
            Create an account
          </Typography>
        </Link>
      </Box>
    </Container>
  );
}

export default Login;
