import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Type" value={getAlertTypeLabel(alert.alert_type)} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Timestamp" value={alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Not provided'} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Deadline" value={alert.deadline ? new Date(alert.deadline).toLocaleString() : 'None'} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Status" value={alert.status} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Reference" value={alert.reference_label || '—'} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Severity" value={alert.severity || 'Not specified'} /></Grid>
            {alert.metadata?.document_type && <Grid item xs={12} sm={6} md={4}><InfoItem label="Document" value={alert.metadata.document_type.replaceAll('_', ' ')} /></Grid>}
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Issue date" value={alert.metadata?.issue_date || 'Missing'} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Expiry date" value={alert.metadata?.expiry_date || 'Missing'} /></Grid>
            {alert.metadata?.station_name && <Grid item xs={12} sm={6} md={4}><InfoItem label="Station" value={alert.metadata.station_name} /></Grid>}
            {alert.metadata?.liters !== undefined && <Grid item xs={12} sm={6} md={4}><InfoItem label="Fuel quantity" value={`${alert.metadata.liters} liters`} /></Grid>}
            {alert.metadata?.cost_per_liter !== undefined && <Grid item xs={12} sm={6} md={4}><InfoItem label="Cost per liter" value={alert.metadata.cost_per_liter} /></Grid>}
            {alert.metadata?.workshop && <Grid item xs={12} sm={6} md={4}><InfoItem label="Workshop" value={alert.metadata.workshop} /></Grid>}
            {alert.metadata?.mechanic_name && <Grid item xs={12} sm={6} md={4}><InfoItem label="Mechanic" value={alert.metadata.mechanic_name} /></Grid>}
            {alert.metadata?.reported_to && <Grid item xs={12} sm={6} md={4}><InfoItem label="Reported to" value={alert.metadata.reported_to} /></Grid>}
            {alert.metadata?.damage_cost !== null && alert.metadata?.damage_cost !== undefined && <Grid item xs={12} sm={6} md={4}><InfoItem label="Damage cost" value={alert.metadata.damage_cost} /></Grid>}
          </Grid>
          {(alert.metadata?.driver_id || alert.metadata?.vehicle_id) && (
            <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: "divider" }}>
              <Typography variant="subtitle2" fontWeight={700} mb={2}>
                Related records
              </Typography>
              <Grid container spacing={3}>
                {alert.metadata?.driver_id && (
                  <Grid item xs={12} sm={6} md={4}>
                    <LinkInfoItem
                      label="Driver"
                      value={alert.metadata.driver_name}
                      onClick={() => navigate(`/dashboard/drivers/${alert.metadata.driver_id}`)}
                    />
                  </Grid>
                )}
                {alert.metadata?.vehicle_id && (
                  <Grid item xs={12} sm={6} md={4}>
                    <LinkInfoItem
                      label="Vehicle"
                      value={alert.metadata.vehicle_name || alert.metadata.vehicle_registration}
                      onClick={() => navigate(`/dashboard/vehicles/${alert.metadata.vehicle_id}`)}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Description
          </Typography>
          <Typography
            variant="body1"
            color="text.primary"
            sx={{ whiteSpace: "pre-line" }}
          >
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

function LinkInfoItem({ label, value, onClick }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" display="block" lineHeight={1.2} mb={0.5}>
        {label}
      </Typography>
      <Button onClick={onClick} sx={{ p: 0, minWidth: 0, justifyContent: 'flex-start', textTransform: 'none', fontWeight: 500 }}>
        {value || 'Not provided'}
      </Button>
    </Box>
  );
}

export default AlertDetails;
