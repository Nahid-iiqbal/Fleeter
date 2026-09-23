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
  Paper
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DescriptionIcon from "@mui/icons-material/Description";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

function DriverDetails({ driverId, onBack }) {
  const navigate = useNavigate();

  const [driver, setDriver] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        setLoading(true);
        setError("");
        const [data, documentData] = await Promise.all([
          apiFetch(`/api/drivers/${driverId}`),
          apiFetch(`/api/drivers/${driverId}/documents`),
        ]);
        setDriver(data);
        setDocuments(documentData);
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
      case "active": return "success";
      case "on_leave": return "warning";
      case "suspended": return "error";
      case "terminated": return "default";
      default: return "default";
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
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: "divider", p: 3, mx: -3, mt: -3, mb: 1, borderRadius: 0, bgcolor: "background.paper", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Driver Profile</Typography>
          <Typography variant="body2" color="text.secondary">Driver ID #{driver.driver_id}</Typography>
        </Box>
      </Paper>

      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      {/* Driver Identity Card */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
            <Avatar sx={{ width: 70, height: 70, bgcolor: "primary.main", fontSize: "1.75rem", fontWeight: 700 }}>
              {driver.full_name?.charAt(0).toUpperCase()}
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
          <Chip
            label={driver.status?.replace("_", " ")}
            color={getStatusColor(driver.status)}
            sx={{ fontWeight: 700, textTransform: "capitalize", px: 1, fontSize: "0.875rem" }}
          />
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>Personal Information</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Full Name" value={driver.full_name} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Phone" value={driver.phone} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Username" value={driver.username || "Not linked"} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Email" value={driver.email} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Joined Date" value={driver.joined_date} /></Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* License Information */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>License Information</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}><InfoItem label="Document Number" value={driver.document_no} /></Grid>
            <Grid item xs={12} sm={6} md={3}><InfoItem label="Document Type" value={driver.document_type?.replaceAll("_", " ")} sx={{ textTransform: "capitalize" }} /></Grid>
            <Grid item xs={12} sm={6} md={3}><InfoItem label="Issue Date" value={driver.document_issue_date} /></Grid>
            <Grid item xs={12} sm={6} md={3}><InfoItem label="Expiry Date" value={driver.document_expiry_date} /></Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>Driver Documents</Typography>
          {documents.length === 0 ? (
            <Typography color="text.secondary" fontStyle="italic">No documents uploaded.</Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {documents.map((document) => {
                const expired = new Date(document.expiry_date) < new Date();
                return (
                  <Paper key={document.document_id} elevation={0} sx={{ p: 2, border: 1, borderColor: "divider", borderLeft: 6, borderLeftColor: expired ? "error.main" : "success.main", display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <Box sx={{ width: 100, height: 100, flexShrink: 0, borderRadius: 1, overflow: "hidden", bgcolor: "action.hover", border: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {document.document_url ? (
                        document.document_url.toLowerCase().endsWith(".pdf") ? (
                          <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                            <DescriptionIcon sx={{ fontSize: 32 }} />
                            <Typography variant="caption" display="block">PDF</Typography>
                          </Box>
                        ) : (
                          <Box component="img" src={`http://localhost:5000${document.document_url}`} alt={document.document_type} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )
                      ) : (
                        <Typography variant="caption" color="text.secondary">No file</Typography>
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ textTransform: "capitalize" }}>
                          {document.document_type?.replaceAll("_", " ")}
                        </Typography>
                        {expired && <Chip label="Expired" color="error" size="small" />}
                      </Box>
                      <Typography variant="body2" color="text.secondary">Number: {document.document_no}</Typography>
                      <Typography variant="body2" color="text.secondary">Issued: {document.issue_date}</Typography>
                      <Typography variant="body2" color={expired ? "error.main" : "success.main"} fontWeight={700}>Expires: {document.expiry_date}</Typography>
                      {document.document_url && (
                        <Button href={`http://localhost:5000${document.document_url}`} target="_blank" rel="noopener noreferrer" startIcon={<OpenInNewIcon />} size="small" sx={{ mt: 1 }}>
                          Open document
                        </Button>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Record Information */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>Record Information</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Driver ID" value={driver.driver_id} /></Grid>
            <Grid item xs={12} sm={6} md={4}><InfoItem label="Created At" value={driver.created_at ? new Date(driver.created_at).toLocaleString() : null} /></Grid>
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

export default DriverDetails;
