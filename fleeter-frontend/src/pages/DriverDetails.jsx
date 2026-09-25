import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Paper,
  FormControl,
  MenuItem,
  Select,
  IconButton,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DescriptionIcon from "@mui/icons-material/Description";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { API_BASE_URL } from "../utils/api";

function DriverDetails({ driverId, onBack }) {
  const navigate = useNavigate();

  const [driver, setDriver] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showIncidents, setShowIncidents] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [terminating, setTerminating] = useState(false);

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        setLoading(true);
        setError("");
        const [data, documentData, incidentData] = await Promise.all([
          apiFetch(`/api/drivers/${driverId}`),
          apiFetch(`/api/drivers/${driverId}/documents`),
          apiFetch(`/api/drivers/${driverId}/incidents`),
        ]);
        setDriver(data);
        setDocuments(documentData);
        setIncidents(incidentData);
      } catch (err) {
        console.error("Error loading driver:", err);
        setError(err.message || "Unable to load driver information.");
      } finally {
        setLoading(false);
      }
    };
    fetchDriver();
  }, [driverId]);

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
      case "active":
        return "success";
      case "dispatched":
        return "info";
      case "on_leave":
        return "warning";
      case "suspended":
        return "error";
      case "terminated":
        return "default";
      default:
        return "default";
    }
  };

  const handleStatusChange = async (event) => {
    const status = event.target.value;
    if (!["available", "suspended", "on_leave"].includes(driver.status) || status === driver.status) return;

    setStatusUpdating(true);
    setError("");
    try {
      const updatedDriver = await apiFetch(`/api/drivers/${driverId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setDriver((currentDriver) => ({ ...currentDriver, ...updatedDriver }));
    } catch (err) {
      setError(err.message || "Unable to update driver status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleTerminate = async () => {
    if (!window.confirm("Terminate this driver and remove them from the company?")) {
      return;
    }

    setTerminating(true);
    setError("");
    try {
      await apiFetch(`/api/drivers/${driverId}`, { method: "DELETE" });
      onBack();
    } catch (err) {
      setError(err.message || "Unable to terminate driver.");
      setTerminating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading driver profile...</Typography>
      </Box>
    );
  }

  if (error || !driver) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 3 }}>
          Back to Drivers
        </Button>
        <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Driver Unavailable
            </Typography>
            {error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Typography color="text.secondary">This driver could not be found.</Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 4 }}>
      {/* Header */}
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
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Driver Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Driver ID #{driver.driver_id}
          </Typography>
        </Box>
      </Paper>

      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Driver Identity Card */}
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
              src={
                driver.profile_picture_url
                  ? `${API_BASE_URL}${driver.profile_picture_url}`
                  : undefined
              }
              sx={{
                width: 70,
                height: 70,
                bgcolor: "primary.main",
                fontSize: "1.75rem",
                fontWeight: 700,
              }}
            >
              {driver.full_name ? driver.full_name.charAt(0).toUpperCase() : "D"}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {driver.full_name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Driver #{driver.driver_id}
              </Typography>
            </Box>
          </Box>

          {["available", "suspended", "on_leave"].includes(driver.status) ? (
            <FormControl size="small" sx={{ minWidth: 135 }}>
              <Select
                value={driver.status}
                onChange={handleStatusChange}
                disabled={statusUpdating}
                color={getStatusColor(driver.status)}
                sx={{ fontWeight: 700, textTransform: "capitalize" }}
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="on_leave">On leave</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <Chip
              label={driver.status?.replace("_", " ")}
              color={getStatusColor(driver.status)}
              sx={{
                fontWeight: 700,
                textTransform: "capitalize",
                px: 1,
                fontSize: "0.875rem",
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>
            Personal Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <InfoItem label="Full Name" value={driver.full_name} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoItem label="Phone" value={driver.phone} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoItem label="Username" value={driver.username || "Not linked"} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoItem label="Email" value={driver.email} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoItem label="Joined Date" value={driver.joined_date} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* License Information */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>
            License Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem label="Document Number" value={driver.document_no} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem
                label="Document Type"
                value={driver.document_type?.replaceAll("_", " ")}
                sx={{ textTransform: "capitalize" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem label="Issue Date" value={driver.document_issue_date} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem label="Expiry Date" value={driver.document_expiry_date} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Driver Documents */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              mb: showDocuments ? 3 : 0,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Driver Documents
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {documents.length} document{documents.length !== 1 ? "s" : ""} on file.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title={showDocuments ? "Hide Documents" : "View Documents"}>
                <IconButton
                  color="primary"
                  onClick={() => setShowDocuments((visible) => !visible)}
                  sx={{ border: 1, borderColor: "primary.main", borderRadius: 2 }}
                >
                  {showDocuments ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {showDocuments && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}>
              {documents.length === 0 ? (
                <Typography color="text.secondary" fontStyle="italic">
                  No documents uploaded.
                </Typography>
              ) : (
                documents.map((document) => {
                  const expired = new Date(document.expiry_date) < new Date();
                  return (
                    <Paper
                      key={document.document_id}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: "divider",
                        borderLeft: 6,
                        borderLeftColor: expired ? "error.main" : "success.main",
                        display: "flex",
                        gap: 2,
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box
                        sx={{
                          width: 100,
                          height: 100,
                          flexShrink: 0,
                          borderRadius: 1,
                          overflow: "hidden",
                          bgcolor: "action.hover",
                          border: 1,
                          borderColor: "divider",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {document.document_url ? (
                          document.document_url.toLowerCase().endsWith(".pdf") ? (
                            <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                              <DescriptionIcon sx={{ fontSize: 32 }} />
                              <Typography variant="caption" display="block">
                                PDF
                              </Typography>
                            </Box>
                          ) : (
                            <Box
                              component="img"
                              src={`${API_BASE_URL}${document.document_url}`}
                              alt={document.document_type}
                              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          )
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No file
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ textTransform: "capitalize" }}>
                            {document.document_type?.replaceAll("_", " ")}
                          </Typography>
                          {expired && <Chip label="Expired" color="error" size="small" />}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Number: {document.document_no}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Issued: {document.issue_date}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={expired ? "error.main" : "success.main"}
                          fontWeight={700}
                        >
                          Expires: {document.expiry_date}
                        </Typography>
                        {document.document_url && (
                          <Tooltip title="Open Document">
                            <IconButton
                              href={`${API_BASE_URL}${document.document_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="primary"
                              size="small"
                              sx={{ mt: 1, border: 1, borderColor: "primary.main", borderRadius: 2 }}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Paper>
                  );
                })
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Incidents */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              mb: showIncidents ? 3 : 0,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Incidents
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {incidents.length} incident{incidents.length !== 1 ? "s" : ""} recorded.
              </Typography>
            </Box>
            <Tooltip title={showIncidents ? "Hide Incidents" : "View Incidents"}>
              <IconButton
                color="primary"
                onClick={() => setShowIncidents((visible) => !visible)}
                sx={{ border: 1, borderColor: "primary.main", borderRadius: 2 }}
              >
                {showIncidents ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>

          {showIncidents && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}>
              {incidents.length === 0 ? (
                <Typography color="text.secondary" fontStyle="italic">
                  No incidents recorded.
                </Typography>
              ) : (
                incidents.map((incident) => (
                  <Paper key={incident.incident_id} elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {incident.type}
                      </Typography>
                      <Chip
                        label={incident.resolved ? "Resolved" : "Open"}
                        color={incident.resolved ? "success" : "error"}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {incident.incident_date ? new Date(incident.incident_date).toLocaleString() : "Date not provided"}{" "}
                      · Trip #{incident.trip_id} · {incident.registration_no}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {incident.description || "No notes provided."}
                    </Typography>
                    {incident.severity && (
                      <Typography variant="body2" color="text.secondary">
                        Severity: {incident.severity}
                      </Typography>
                    )}
                  </Paper>
                ))
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Record Information */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>
            Record Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <InfoItem label="Driver ID" value={driver.driver_id} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoItem
                label="Created At"
                value={driver.created_at ? new Date(driver.created_at).toLocaleString() : null}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Button
        variant="contained"
        color="error"
        onClick={handleTerminate}
        disabled={terminating}
        sx={{ alignSelf: "flex-start" }}
      >
        {terminating ? "Terminating..." : "Terminate this Driver"}
      </Button>
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

export default DriverDetails;
