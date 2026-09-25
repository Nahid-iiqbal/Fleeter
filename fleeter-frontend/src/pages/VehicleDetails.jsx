import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { apiFetch } from "../utils/api";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  TextField,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import MapIcon from "@mui/icons-material/Map";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

// Best Practice: Define your API base URL via environment variables.
const API_BASE_URL = process.env.REACT_APP_API_URL || import.meta.env?.VITE_API_URL || "http://localhost:5000";

function VehicleDetails({ vehicleId, onBack }) {

  const [vehicle, setVehicle] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [images, setImages] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [trips, setTrips] = useState([]);
  const [showTrips, setShowTrips] = useState(false);
  const [routeMapOpen, setRouteMapOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [telemetryPath, setTelemetryPath] = useState([]);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDocuments, setShowDocuments] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [showIncidents, setShowIncidents] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);

  const [editDocumentId, setEditDocumentId] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [selectedDocCount, setSelectedDocCount] = useState(0);
  const [uploadFeedback, setUploadFeedback] = useState({
    message: "",
    isError: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [vehicleData, docsData, imageData, incidentData, maintenanceData, tripsData] = await Promise.all([
          apiFetch(`/api/vehicles/${vehicleId}`),
          apiFetch(`/api/vehicles/${vehicleId}/documents`).catch(() => []),
          apiFetch(`/api/vehicles/${vehicleId}/images`).catch(() => []),
          apiFetch(`/api/vehicles/${vehicleId}/incidents`).catch(() => []),
          apiFetch(`/api/vehicles/${vehicleId}/maintenance`).catch(() => []),
          apiFetch(`/api/vehicles/${vehicleId}/trips`).catch(() => []),
        ]);
        setVehicle(vehicleData);
        setDocuments(docsData);
        setImages(imageData);
        setIncidents(incidentData);
        setMaintenance(maintenanceData);
          setTrips(tripsData);
      } catch (err) {
        console.error("Error loading vehicle:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vehicleId]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("imageFile", file);

    try {
      const data = await apiFetch(`/api/vehicles/${vehicleId}/images`, {
        method: "POST",
        body: formData,
      });
      setImages((prev) => [data.image, ...prev]);
      setShowImages(true);
    } catch (err) {
      alert(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
      event.target.value = ""; // Reset input
    }
  };

  const handleImageDelete = async (imageId) => {
    try {
      await apiFetch(`/api/vehicles/${vehicleId}/images/${imageId}`, {
        method: "DELETE",
      });
      setImages((currentImages) =>
        currentImages.filter((image) => image.image_id !== imageId),
      );
    } catch (err) {
      alert(err.message || "Failed to delete vehicle image.");
    }
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setEditDocumentId(null);
    setUploadFeedback({ message: "", isError: false });
    setSelectedDocCount(0);
    setTimeout(() => {
      const form = document.getElementById("upload-doc-form");
      if (form) form.reset();
    }, 100);
  };

  const handleOpenRouteMap = async (tripId) => {
    setSelectedTripId(tripId);
    setTelemetryPath([]);
    setRouteMapOpen(true);
    setTelemetryLoading(true);
    try {
      const data = await apiFetch(`/api/tracking/trips/${tripId}/route`);
      setTelemetryPath(data.map((ping) => [ping.latitude, ping.longitude]));
    } catch (error) {
      console.error(error);
    } finally {
      setTelemetryLoading(false);
    }
  };

  const handleEditClick = (doc) => {
    setEditDocumentId(doc.document_id);
    setUploadFeedback({ message: "", isError: false });
    setSelectedDocCount(0);
    setUploadDialogOpen(true);

    setTimeout(() => {
      const form = document.getElementById("upload-doc-form");
      if (form) {
        form.elements["document_type"].value = doc.document_type;
        form.elements["document_no"].value = doc.document_no;
        form.elements["issue_date"].value = doc.issue_date.split("T")[0];
        form.elements["expiry_date"].value = doc.expiry_date.split("T")[0];
        form.elements["documentFile"].required = false; // Optional on edit
      }
    }, 100);
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadFeedback({ message: "", isError: false });

    const formElement = e.target;
    const formData = new FormData(formElement);

    try {
      if (editDocumentId) {
        // PUT
        const data = await apiFetch(
          `/api/vehicles/${vehicleId}/documents/${editDocumentId}`,
          {
            method: "PUT",
            body: formData,
          },
        );
        setDocuments(
          documents.map((d) =>
            d.document_id === editDocumentId ? data.document : d,
          ),
        );
        handleCloseUploadDialog();
      } else {
        // POST
        const data = await apiFetch(`/api/vehicles/${vehicleId}/documents`, {
          method: "POST",
          body: formData,
        });
        setDocuments((prev) => [data.document, ...prev]);
        setShowDocuments(true);
        handleCloseUploadDialog();
      }
    } catch (err) {
      console.error("Upload/Update failed:", err);
      setUploadFeedback({
        message: err.message || "Failed to save document",
        isError: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiFetch(
        `/api/vehicles/${vehicleId}/documents/${deleteConfirmId}`,
        { method: "DELETE" },
      );
      setDocuments(documents.filter((doc) => doc.document_id !== deleteConfirmId));
      setDeleteConfirmId(null);
      setEditDocumentId(null);
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
      setDeleteConfirmId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading vehicle details...</Typography>
      </Box>
    );
  }

  if (error || !vehicle) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 3 }}>
          Back to Vehicles
        </Button>
        <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Vehicle Unavailable
            </Typography>
            {error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Typography color="text.secondary">
                We couldn't find the requested vehicle.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  const statusColors = {
    good: "success",
    needs_service: "warning",
    in_maintenance: "warning",
    retired: "default",
  };
  const statusColor = statusColors[vehicle.condition_status] || "default";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 4 }}>
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          Back to Vehicles
        </Button>
      </Box>

      {/* Profile Header */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider", overflow: "visible" }}>
        <CardContent
          sx={{
            p: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                bgcolor: "primary.main",
                borderRadius: 2,
              }}
            >
              <LocalShippingIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} color="text.primary">
                {vehicle.registration_no}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {vehicle.brand || "Unknown Brand"} {vehicle.model || ""}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={vehicle.condition_status ? vehicle.condition_status.replace("_", " ") : "Unknown"}
            color={statusColor}
            sx={{ fontWeight: 600, textTransform: "capitalize", px: 1 }}
          />
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>
            Vehicle Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem label="Vehicle ID" value={vehicle.vehicle_id} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem label="Registration Number" value={vehicle.registration_no} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem label="Vehicle Type" value={vehicle.type} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem label="Brand" value={vehicle.brand} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem label="Model" value={vehicle.model} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem label="Manufacturing Year" value={vehicle.year} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem label="Capacity" value={vehicle.capacity} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoItem label="Fuel Type" value={vehicle.fuel_type} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="overline" color="text.secondary" display="block" lineHeight={1.2} mb={0.5}>
                Registration Document
              </Typography>
              {vehicle.registration_document_url ? (
                <Tooltip title="View Registration Document">
                  <IconButton
                    href={`${API_BASE_URL}${vehicle.registration_document_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                    size="small"
                    sx={{ border: 1, borderColor: "primary.main", borderRadius: 2 }}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Typography variant="body1" fontWeight={500}>-</Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {/* Current Assignment */}
          <Card elevation={0} sx={{ border: 1, borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={3}>
                Current Assignment
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  bgcolor: "action.hover",
                  borderRadius: 2,
                }}
              >
                <Avatar sx={{ bgcolor: "background.paper", color: "text.secondary" }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                    CURRENT DRIVER
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="text.primary">
                    {vehicle.driver_name || "Unassigned"}
                  </Typography>
                </Box>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Service Information */}
          <Card elevation={0} sx={{ border: 1, borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={3}>
                Service Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <InfoItem
                    label="Last Service Date"
                    value={
                      vehicle.last_service_date
                        ? new Date(vehicle.last_service_date).toLocaleDateString()
                        : "Never Serviced"
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoItem
                    label="Availability Status"
                    value={vehicle.availability_status?.replace("_", " ")}
                    sx={{ textTransform: "capitalize" }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Document Viewer */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: showDocuments ? 3 : 0,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Vehicle Documents
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {documents.length} document{documents.length !== 1 ? "s" : ""} on file.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Upload New Document">
                <IconButton
                  color="primary"
                  onClick={() => {
                    setUploadDialogOpen(true);
                    setEditDocumentId(null);
                    setTimeout(() => {
                      const form = document.getElementById('upload-doc-form');
                      if (form) {
                        const firstInput = form.querySelector('input');
                        if (firstInput) firstInput.focus();
                      }
                    }, 100);
                  }}
                  sx={{ border: 1, borderColor: 'primary.main', borderRadius: 2 }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={showDocuments ? "Hide Documents" : "View Documents"}>
                <IconButton
                  color="primary"
                  onClick={() => setShowDocuments(!showDocuments)}
                  sx={{ border: 1, borderColor: 'primary.main', borderRadius: 2 }}
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
                  No documents uploaded yet.
                </Typography>
              ) : (
                documents.map((doc) => {
                  const isExpired = new Date(doc.expiry_date) < new Date();
                  const hasAlert = doc.alert_triggered || isExpired;
                  const borderColor = hasAlert ? "error.main" : "success.main";

                  return (
                    <Paper
                      key={doc.document_id}
                      elevation={0}
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderLeft: 6,
                        borderLeftColor: borderColor,
                        p: 2,
                        borderRadius: 2,
                        display: "flex",
                        gap: 3,
                        alignItems: "flex-start",
                        flexWrap: { xs: "wrap", sm: "nowrap" },
                      }}
                    >
                      {/* Document Image Thumbnail */}
                      <Box
                        sx={{
                          width: 120,
                          height: 120,
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
                        {doc.document_url ? (
                          doc.document_url.toLowerCase().endsWith(".pdf") ? (
                            <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                              <DescriptionIcon sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="caption" display="block">PDF</Typography>
                            </Box>
                          ) : (
                            <Box
                              component="img"
                              src={`${API_BASE_URL}${doc.document_url}`}
                              alt={doc.document_type}
                              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          )
                        ) : (
                          <Typography variant="caption" color="text.secondary">No file</Typography>
                        )}
                      </Box>

                      {/* Document Details */}
                      <Box sx={{ flex: 1, width: "100%" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                            {doc.document_type.replace("_", " ")}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            {isExpired && (
                              <Chip label="EXPIRED" color="error" size="small" sx={{ fontWeight: 700 }} />
                            )}
                            <IconButton onClick={() => handleEditClick(doc)} color="primary" size="small">
                              <EditIcon />
                            </IconButton>
                          </Box>
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <InfoItem label="Doc Number" value={doc.document_no} />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <InfoItem label="Alert" value={doc.alert_triggered ? "Yes" : "No"} />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <InfoItem label="Issue Date" value={new Date(doc.issue_date).toLocaleDateString()} />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <InfoItem label="Expiry Date" value={new Date(doc.expiry_date).toLocaleDateString()} />
                          </Grid>
                        </Grid>

                        {doc.document_url && (
                          <Tooltip title="Open Document">
                            <IconButton
                              href={`${API_BASE_URL}${doc.document_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="primary"
                              size="small"
                              sx={{ mt: 2, border: 1, borderColor: "primary.main", borderRadius: 2 }}
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

      {/* Hidden file input for auto-uploading images */}
      <input type="file" id="upload-image-input" hidden accept="image/*" onChange={handleImageUpload} />

      <ExpandableRecordSection
        title="Vehicle Images"
        count={images.length}
        itemLabel="image"
        open={showImages}
        onToggle={() => setShowImages((visible) => !visible)}
        onAdd={() => document.getElementById("upload-image-input").click()}
        addTitle="Upload Image"
      >
        {images.length === 0 ? (
          <Typography color="text.secondary" fontStyle="italic">
            No vehicle images uploaded.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {images.map((image) => (
              <Grid item xs={12} sm={6} md={4} key={image.image_id}>
                <Paper elevation={0} sx={{ border: 1, borderColor: "divider", overflow: "hidden" }}>
                  <Box
                    component="a"
                    href={`${API_BASE_URL}${image.image_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "block" }}
                  >
                    <Box
                      component="img"
                      src={`${API_BASE_URL}${image.image_url}`}
                      alt={`Vehicle ${vehicle.registration_no}`}
                      sx={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                    />
                  </Box>
                  <Button
                    color="error"
                    size="small"
                    onClick={() => handleImageDelete(image.image_id)}
                    sx={{ m: 1 }}
                  >
                    Delete image
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </ExpandableRecordSection>

      <ExpandableRecordSection
        title="Incidents"
        count={incidents.length}
        itemLabel="incident"
        open={showIncidents}
        onToggle={() => setShowIncidents((visible) => !visible)}
      >
        {incidents.length === 0 ? (
          <Typography color="text.secondary" fontStyle="italic">
            No incidents recorded.
          </Typography>
        ) : (
          incidents.map((incident) => (
            <Paper key={incident.incident_id} elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Typography variant="subtitle1" fontWeight={700}>{incident.type}</Typography>
                <Chip label={incident.resolved ? "Resolved" : "Open"} color={incident.resolved ? "success" : "error"} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {incident.incident_date ? new Date(incident.incident_date).toLocaleString() : "Date not provided"} · Trip #{incident.trip_id} · Driver: {incident.driver_name}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>{incident.description || "No notes provided."}</Typography>
              {incident.severity && <Typography variant="body2" color="text.secondary">Severity: {incident.severity}</Typography>}
              {incident.damage_cost !== null && incident.damage_cost !== undefined && <Typography variant="body2" color="text.secondary">Damage cost: ৳{incident.damage_cost}</Typography>}
            </Paper>
          ))
        )}
      </ExpandableRecordSection>

      <ExpandableRecordSection
        title="Maintenance"
        count={maintenance.length}
        itemLabel="maintenance record"
        open={showMaintenance}
        onToggle={() => setShowMaintenance((visible) => !visible)}
      >
        {maintenance.length === 0 ? (
          <Typography color="text.secondary" fontStyle="italic">
            No maintenance records found.
          </Typography>
        ) : (
          maintenance.map((record) => (
            <Paper key={record.maintenance_id} elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
              <Typography variant="subtitle1" fontWeight={700}>{record.service_type}</Typography>
              <Typography variant="body2" color="text.secondary">
                {record.service_date ? new Date(record.service_date).toLocaleDateString() : "Date not provided"}
                {record.workshop ? ` · ${record.workshop}` : ""}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>{record.description || "No notes provided."}</Typography>
              <Typography variant="body2" color="text.secondary">
                Cost: ৳{record.cost ?? "Not provided"} · Odometer: {record.odometer_km ?? "Not provided"} km
              </Typography>
              {record.mechanic_name && <Typography variant="body2" color="text.secondary">Mechanic: {record.mechanic_name}</Typography>}
            </Paper>
          ))
        )}
      </ExpandableRecordSection>

      {/* Upload Document Modal */}
      
        {/* Trip History Section */}
        <ExpandableRecordSection
          title="Trip History"
          count={trips.length}
          itemLabel="trip"
          open={showTrips}
          onToggle={() => setShowTrips((visible) => !visible)}
        >
          {showTrips && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {trips.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No trips recorded for this vehicle.
                </Typography>
              ) : (
                trips.map((trip) => (
                  <Paper key={trip.trip_id} elevation={0} sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Trip #{trip.trip_id} - {trip.route_name || "Custom Route"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          <strong>Driver:</strong> {trip.driver_name || "Unknown"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Status:</strong> {trip.status.toUpperCase()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {trip.origin} ➔ {trip.destination}
                        </Typography>
                      </Box>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<MapIcon />} 
                        onClick={() => handleOpenRouteMap(trip.trip_id)}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        View Route
                      </Button>
                    </Box>
                  </Paper>
                ))
              )}
            </Box>
          )}
        </ExpandableRecordSection>

        {/* Route Map Dialog */}
        <Dialog open={routeMapOpen} onClose={() => setRouteMapOpen(false)} maxWidth="md" fullWidth>
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h6" fontWeight={700}>Trip #{selectedTripId} Route Map</Typography>
            <IconButton onClick={() => setRouteMapOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <DialogContent sx={{ p: 0, height: "60vh", minHeight: 400 }}>
            {telemetryLoading ? (
              <Box sx={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center" }}>
                <CircularProgress />
              </Box>
            ) : telemetryPath.length === 0 ? (
              <Box sx={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
                <MapIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
                <Typography variant="body1" color="text.secondary">No telemetry data recorded for this trip.</Typography>
              </Box>
            ) : (
              <MapContainer 
                center={telemetryPath[Math.floor(telemetryPath.length / 2)]} 
                zoom={11} 
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <Polyline positions={telemetryPath} color="#3b82f6" weight={4} opacity={0.8} />
                <Marker position={telemetryPath[0]}>
                  <Popup>Start Point</Popup>
                </Marker>
                <Marker position={telemetryPath[telemetryPath.length - 1]}>
                  <Popup>End Point</Popup>
                </Marker>
              </MapContainer>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editDocumentId ? "Edit Document" : "Upload New Document"}
        </DialogTitle>
        <form id="upload-doc-form" onSubmit={handleDocumentSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Document Type"
                  name="document_type"
                  placeholder="e.g., Registration, Insurance"
                  required
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Document Number"
                  name="document_no"
                  placeholder="Document Number"
                  required
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Issue Date"
                  name="issue_date"
                  type="date"
                  required
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Expiry Date"
                  name="expiry_date"
                  type="date"
                  required
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" component="label" fullWidth sx={{ justifyContent: 'flex-start' }} size="small">
                  Choose file (Image/PDF)
                  <input
                    hidden
                    type="file"
                    name="documentFile"
                    accept="image/*,.pdf"
                    required={!editDocumentId}
                    onChange={(event) => setSelectedDocCount(event.target.files.length)}
                  />
                </Button>
                {selectedDocCount > 0 && (
                  <Typography variant="caption" display="block" sx={{ mt: 0.5, ml: 1, color: 'success.main' }}>
                    {selectedDocCount} file selected
                  </Typography>
                )}
              </Grid>
            </Grid>

            {uploadFeedback.message && (
              <Alert severity={uploadFeedback.isError ? "error" : "success"} sx={{ mt: 2 }}>
                {uploadFeedback.message}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUploadDialog} variant="outlined" color="primary" disabled={uploading} sx={{ minWidth: 100 }}>
              Cancel
            </Button>
            {editDocumentId && (
              <Button color="error" variant="outlined" disabled={uploading} onClick={() => { handleCloseUploadDialog(); setDeleteConfirmId(editDocumentId); }}>
                Delete
              </Button>
            )}
            <Button type="submit" variant="contained" color="primary" disabled={uploading} sx={{ minWidth: 120 }}>
              {uploading ? "Saving..." : editDocumentId ? "Update" : "Save Document"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete this document? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteConfirmId(null)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={executeDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ExpandableRecordSection({ title, count, itemLabel, open, onToggle, onAdd, addTitle, children }) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: open ? 3 : 0 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {count} {itemLabel}{count !== 1 ? "s" : ""} recorded.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onAdd && (
              <Tooltip title={addTitle || "Add"}>
                <IconButton
                  color="primary"
                  onClick={onAdd}
                  sx={{ border: 1, borderColor: 'primary.main', borderRadius: 2 }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={open ? `Hide ${title}` : `View ${title}`}>
              <IconButton
                color="primary"
                onClick={onToggle}
                sx={{ border: 1, borderColor: 'primary.main', borderRadius: 2 }}
              >
                {open ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {open && <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}>{children}</Box>}
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value, sx }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" display="block" lineHeight={1.2} mb={0.5}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={500} color="text.primary" sx={sx}>
        {value !== null && value !== undefined && value !== "" ? value : "-"}
      </Typography>
    </Box>
  );
}

export default VehicleDetails;
