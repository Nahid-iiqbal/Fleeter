import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress
} from "@mui/material";
import { apiFetch } from "../utils/api";
import { useThemeSettings } from "../context/ThemeSettingsContext";

export default function AccountSettings() {
  const { mode, notifications, setSettings } = useThemeSettings();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [localTheme, setLocalTheme] = useState(mode);
  const [localNotifs, setLocalNotifs] = useState(notifications);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiFetch("/api/auth/account");
        setForm({
          username: data.username || "",
          email: data.email || "",
          password: "",
        });
        setLocalTheme(data.theme || "light");
        setLocalNotifs(data.notifications_enabled !== false);
      } catch (err) {
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await apiFetch("/api/auth/account", {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          theme: localTheme,
          notifications_enabled: localNotifs
        }),
      });
      setSuccess("Account updated successfully!");
      setSettings(localTheme, localNotifs);
      setSettings(undefined, localNotifs);

      // Clear password field after successful update
      setForm((prev) => ({ ...prev, password: "" }));

      // Update local storage explicitly
      localStorage.setItem("theme", localTheme);
    } catch (err) {
      setError(err.message || "Failed to update account.");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth="600px" mx="auto" mt={2}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" mb={3} fontWeight="bold">
          Account Settings
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleSave}>
          <Typography variant="h6" mb={2}>Profile Information</Typography>
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            type="email"
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            type="password"
            label="New Password (leave blank to keep current)"
            name="password"
            value={form.password}
            onChange={handleChange}
            margin="normal"
          />

          <Typography variant="h6" mt={4} mb={2}>Preferences</Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={localTheme === "dark"}
                  onChange={(e) => setLocalTheme(e.target.checked ? "dark" : "light")}
                />
              }
              label="Dark Mode"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localNotifs}
                  onChange={(e) => setLocalNotifs(e.target.checked)}
                />
              }
              label="Enable Notifications"
            />
          </Box>

          <Box mt={4}>
            <Button type="submit" variant="contained" color="primary" size="large">
              Save Changes
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
