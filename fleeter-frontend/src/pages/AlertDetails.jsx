import React, { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { apiFetch } from "../utils/api";
import {
  getAlertStatusColor,
  getAlertTypeColor,
  getAlertTypeLabel,
} from "../utils/alerts";

function AlertDetails({ alertType, alertId, onBack }) {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAlert = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await apiFetch(
          `/api/company/alerts/${alertType}/${alertId}`,
        );
        setAlert(data);
      } catch (loadError) {
        setError(loadError.message || "Unable to load alert details.");
      } finally {
        setLoading(false);
      }
    };

    if (alertType && alertId) {
      loadAlert();
    }
  }, [alertType, alertId]);

  if (loading) {
    return (
      <Box
        sx={{
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <CircularProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading alert details...</Typography>
      </Box>
    );
  }

  if (error || !alert) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 3 }}>
          Back to alerts
        </Button>
        <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Alert unavailable
            </Typography>
            <Alert severity="error">
              {error || "This alert could not be found."}
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          p: 3,
          mx: -3,
          mt: -3,
          mb: 1,
          borderRadius: 0,
          bgcolor: "background.paper",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Alert Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getAlertTypeLabel(alert.alert_type)}
          </Typography>
        </Box>
      </Paper>

      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          Back
        </Button>
      </Box>

      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent
          sx={{
            p: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                bgcolor: `${getAlertTypeColor(alert.alert_type)}.main`,
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {getAlertTypeLabel(alert.alert_type).charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {alert.title || getAlertTypeLabel(alert.alert_type)}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {alert.about}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={getAlertTypeLabel(alert.alert_type)}
              color={getAlertTypeColor(alert.alert_type)}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={alert.status}
              color={getAlertStatusColor(alert.status)}
              sx={{ fontWeight: 700, textTransform: "capitalize" }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>
            Alert information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <InfoItem
                label="Type"
                value={getAlertTypeLabel(alert.alert_type)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoItem
                label="Timestamp"
                value={
                  alert.created_at
                    ? new Date(alert.created_at).toLocaleString()
                    : "Not provided"
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoItem
                label="Deadline"
                value={
                  alert.deadline
                    ? new Date(alert.deadline).toLocaleString()
                    : "None"
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoItem label="Status" value={alert.status} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoItem
                label="Reference"
                value={alert.reference_label || "—"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoItem
                label="Severity"
                value={alert.severity || "Not specified"}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Description
          </Typography>
          <Typography variant="body1" color="text.primary">
            {alert.description ||
              "No additional description was provided for this alert."}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

function InfoItem({ label, value }) {
  return (
    <Box>
      <Typography
        variant="overline"
        color="text.secondary"
        display="block"
        lineHeight={1.2}
        mb={0.5}
      >
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={500} color="text.primary">
        {value || "Not provided"}
      </Typography>
    </Box>
  );
}

export default AlertDetails;
