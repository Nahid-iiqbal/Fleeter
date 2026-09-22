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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Stack,
  Link,
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
          {/* Header with consistent margin-bottom */}
          <Box textAlign="center" mb={4}>
            <Typography variant="h5" fontWeight="bold" mb={2}>
              Create an Account
            </Typography>
            <Typography variant="body2" color="text.secondary" >
              Start managing your fleet today.
            </Typography>
          </Box>

          {message && (
            <Alert severity={isSuccess ? "success" : "error"} sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {/* Stack ensures perfectly even spacing between all form elements */}
            <Stack spacing={3} sx={{ pt: 2 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  variant="outlined"
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required={formData.role !== "owner"}
                  fullWidth
                />
                <TextField
                  variant="outlined"
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required={formData.role !== "owner"}
                  fullWidth
                />
              </Stack>
              <TextField
                variant="outlined"
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="username"
              />
              <TextField
                variant="outlined"
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
                variant="outlined"
                type="password"
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="new-password"
              />

              <FormControl fullWidth variant="outlined">
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

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disableElevation
                disabled={loading || isSuccess}
                sx={{ py: 1.5, fontWeight: "bold", mt: 1 }}
              >
                {loading && !isSuccess ? "Signing Up..." : "Sign Up"}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Link component={RouterLink} to="/login" underline="hover" color="primary" fontWeight="bold">
                Sign In
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

export default Register;
