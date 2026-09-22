import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  Alert,
  CircularProgress,
  Grid,
  Stack,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import TuneIcon from "@mui/icons-material/Tune";
import SaveIcon from "@mui/icons-material/Save";
import { apiFetch } from "../utils/api";
import { useThemeSettings } from "../context/ThemeSettingsContext";

export default function AccountSettings() {
  const { mode, notifications, setSettings } = useThemeSettings();

  const [form, setForm] = useState({
    username: "",
    email: "",
    full_name: "",
    phone: "",
    address: "",
    password: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          full_name: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
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
    setSaving(true);
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
      setForm((prev) => ({ ...prev, password: "" }));
      localStorage.setItem("theme", localTheme);
    } catch (err) {
      setError(err.message || "Failed to update account.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={6}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box maxWidth="800px" mx="auto" mt={2} mb={6}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Account Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Manage your profile, security credentials, and application preferences.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      {!error && !success && (!form.full_name || !form.phone || !form.address) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Action Required:</strong> Please complete your profile information (Full Name, Phone, and Address).
        </Alert>
      )}

      <form onSubmit={handleSave}>
        <Stack spacing={4}>
          {/* Profile Information Section */}
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <PersonIcon color="primary" fontSize="large" />
                <Typography variant="h6" fontWeight={700}>
                  Profile Information
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    label="Username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    type="email"
                    label="Email Address"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    label="Full Name"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={2}
                    label="Home Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <SecurityIcon color="primary" fontSize="large" />
                <Typography variant="h6" fontWeight={700}>
                  Security
                </Typography>
              </Box>
              <TextField
                variant="outlined"
                fullWidth
                type="password"
                label="New Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                helperText="Leave this field blank to keep your current password."
              />
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <TuneIcon color="primary" fontSize="large" />
                <Typography variant="h6" fontWeight={700}>
                  Preferences & Interface
                </Typography>
              </Box>

              <Stack spacing={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Enable Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Receive alerts for upcoming trips, document expirations, and maintenance tasks.
                    </Typography>
                  </Box>
                  <Switch
                    checked={localNotifs}
                    onChange={(e) => setLocalNotifs(e.target.checked)}
                    color="primary"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Action Row */}
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={saving}
              sx={{ px: 4, py: 1.5, fontWeight: 700 }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Stack>
      </form>
    </Box>
  );
}
