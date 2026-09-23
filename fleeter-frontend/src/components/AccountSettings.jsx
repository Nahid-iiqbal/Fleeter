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
  Stack,
  Avatar,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
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
    company_name: "",
    role: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [localTheme, setLocalTheme] = useState(mode || "dark");
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
          company_name: data.company_name || "",
          role: data.role || "",
        });
        setLocalTheme(data.theme || "dark");
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
          notifications_enabled: localNotifs,
        }),
      });
      setSuccess("Account updated successfully!");
      setSettings(localTheme, localNotifs);
      setForm((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      setError(err.message || "Failed to update account.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: 4,
        }}
      >
        <CircularProgress size={32} sx={{ mb: 1.5 }} />
        <Typography variant="body2" color="text.secondary">
          Loading settings...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: "500px", mx: "auto", mt: 2, mb: 6 }}>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            mx: "auto",
            mb: 1.5,
            fontSize: "1.5rem",
            fontWeight: 800,
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
          }}
        >
          {form.full_name
            ? form.full_name.charAt(0).toUpperCase()
            : form.username?.charAt(0)?.toUpperCase() || "U"}
        </Avatar>
        <Typography variant="h6" fontWeight={800}>
          {form.full_name || form.username || "Your Profile"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {form.email}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      {!error &&
        !success &&
        (!form.full_name || !form.phone || !form.address) && (
          <Alert severity="warning" sx={{ mb: 2, fontSize: "0.8rem" }}>
            <strong>Action Required:</strong> Please complete your profile
            information.
          </Alert>
        )}

      <form onSubmit={handleSave}>
        <Stack spacing={2}>
          {/* Profile & Security Section (Merged) */}
          <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    background:
                      "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))",
                    border: "1px solid rgba(59,130,246,0.2)",
                  }}
                >
                  <PersonIcon color="primary" fontSize="small" />
                </Avatar>
                <Typography variant="subtitle2" fontWeight={700}>
                  Profile & Security
                </Typography>
              </Box>

              <Stack spacing={1.5}>
                <TextField
                  size="small"
                  variant="outlined"
                  fullWidth
                  label="Username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ sx: { fontSize: "0.85rem" } }}
                  InputProps={{ sx: { fontSize: "0.85rem" } }}
                />
                <TextField
                  size="small"
                  variant="outlined"
                  fullWidth
                  type="email"
                  label="Email Address"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ sx: { fontSize: "0.85rem" } }}
                  InputProps={{ sx: { fontSize: "0.85rem" } }}
                />
                <TextField
                  size="small"
                  variant="outlined"
                  fullWidth
                  label="Full Name"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  InputLabelProps={{ sx: { fontSize: "0.85rem" } }}
                  InputProps={{ sx: { fontSize: "0.85rem" } }}
                />
                {form.role === "owner" && (
                  <TextField
                    size="small"
                    variant="outlined"
                    fullWidth
                    label="Company Name"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    InputLabelProps={{ sx: { fontSize: "0.85rem" } }}
                    InputProps={{ sx: { fontSize: "0.85rem" } }}
                  />
                )}
                <TextField
                  size="small"
                  variant="outlined"
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  InputLabelProps={{ sx: { fontSize: "0.85rem" } }}
                  InputProps={{ sx: { fontSize: "0.85rem" } }}
                />
                <TextField
                  size="small"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={2}
                  label="Home Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  InputLabelProps={{ sx: { fontSize: "0.85rem" } }}
                  InputProps={{ sx: { fontSize: "0.85rem" } }}
                />

                <Divider sx={{ my: 1 }} />

                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                >
                  UPDATE PASSWORD
                </Typography>
                <TextField
                  size="small"
                  variant="outlined"
                  fullWidth
                  type="password"
                  label="New Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  InputLabelProps={{ sx: { fontSize: "0.85rem" } }}
                  InputProps={{ sx: { fontSize: "0.85rem" } }}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    background:
                      "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.05))",
                    border: "1px solid rgba(167,139,250,0.2)",
                  }}
                >
                  <TuneIcon sx={{ color: "#a78bfa" }} fontSize="small" />
                </Avatar>
                <Typography variant="subtitle2" fontWeight={700}>
                  Preferences
                </Typography>
              </Box>

              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ pr: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Notifications
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ lineHeight: 1.2 }}
                    >
                      Alerts for trips & docs.
                    </Typography>
                  </Box>
                  <Switch
                    size="small"
                    checked={localNotifs}
                    onChange={(e) => setLocalNotifs(e.target.checked)}
                    color="primary"
                  />
                </Box>

                <Divider />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ pr: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Theme
                    </Typography>
                  </Box>
                  <Select
                    size="small"
                    value={localTheme}
                    onChange={(e) => setLocalTheme(e.target.value)}
                    sx={{ minWidth: 100, fontSize: "0.85rem" }}
                  >
                    <MenuItem value="dark" sx={{ fontSize: "0.85rem" }}>
                      Dark
                    </MenuItem>
                    <MenuItem value="light" sx={{ fontSize: "0.85rem" }}>
                      Light
                    </MenuItem>
                  </Select>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            startIcon={
              saving ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveIcon fontSize="small" />
              )
            }
            disabled={saving}
            sx={{ py: 1, fontWeight: 700, fontSize: "0.9rem" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
