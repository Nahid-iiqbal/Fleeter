import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Paper
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function ManagerDetails({ managerId, onBack }) {
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchManager = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await apiFetch(`/api/company/managers/${managerId}`);
        setManager(data);
      } catch (err) {
        console.error("Error loading manager:", err);
        setError(err.message || "Unable to load manager information.");
      } finally {
        setLoading(false);
      }
    };

    fetchManager();
  }, [managerId]);

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading manager profile...</Typography>
      </Box>
    );
  }

  if (error || !manager) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 3 }}>
          Back to Managers
        </Button>
        <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Manager Unavailable
            </Typography>
            {error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Typography color="text.secondary">This manager could not be found.</Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 4 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: "divider", p: 3, mx: -3, mt: -3, mb: 1, borderRadius: 0, bgcolor: "background.paper", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Manager Profile</Typography>
          <Typography variant="body2" color="text.secondary">Manager #{manager.manager_id}</Typography>
        </Box>
      </Paper>

      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          Back
        </Button>
      </Box>

      {/* Identity Card */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
            <Avatar sx={{ width: 70, height: 70, bgcolor: "primary.main", fontSize: "1.75rem", fontWeight: 700 }}>
              {manager.full_name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {manager.full_name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manager #{manager.manager_id}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={manager.is_active ? "Active" : "Inactive"}
            color={manager.is_active ? "success" : "default"}
            sx={{ fontWeight: 700, px: 1, fontSize: "0.875rem" }}
          />
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>Manager Information</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Full Name" value={manager.full_name} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Employee ID" value={manager.employee_id} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Department" value={manager.department} sx={{ textTransform: "capitalize" }} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Phone" value={manager.phone} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Username" value={manager.username || "Not linked"} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Email" value={manager.email} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Joined Date" value={manager.created_at ? new Date(manager.created_at).toLocaleDateString() : null} /></Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

function InfoItem({ label, value, sx }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" display="block" lineHeight={1.2} mb={0.5}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={500} color="text.primary" sx={sx}>
        {value !== null && value !== undefined && value !== "" ? value : "Not provided"}
      </Typography>
    </Box>
  );
}

export default ManagerDetails;
