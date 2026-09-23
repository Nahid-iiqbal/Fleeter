import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

function VehicleDetails({ vehicleId, onBack }) {
  const [vehicle, setVehicle] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDocuments, setShowDocuments] = useState(false);
  const [editDocumentId, setEditDocumentId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState({
    message: "",
    isError: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [vehicleData, docsData] = await Promise.all([
          apiFetch(`/api/vehicles/${vehicleId}`),
          apiFetch(`/api/vehicles/${vehicleId}/documents`).catch(() => []),
        ]);
        setVehicle(vehicleData);
        setDocuments(docsData);
      } catch (err) {
        console.error("Error loading vehicle:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vehicleId]);

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiFetch(
        `/api/vehicles/${vehicleId}/documents/${deleteConfirmId}`,
        {
          method: "DELETE",
        },
      );
      setDocuments(
        documents.filter((doc) => doc.document_id !== deleteConfirmId),
      );
      setDeleteConfirmId(null);

      const form = document.getElementById("upload-doc-form");
      if (form) {
        form.reset();
        if (form.elements["documentFile"])
          form.elements["documentFile"].required = true;
      }
      setEditDocumentId(null);
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
      setDeleteConfirmId(null);
    }
  };

  const handleEditClick = (doc) => {
    setEditDocumentId(doc.document_id);
    setUploadFeedback({ message: "", isError: false });
    // Scroll to form
    setTimeout(() => {
      document
        .getElementById("upload-doc-form")
        .scrollIntoView({ behavior: "smooth" });
      // Pre-fill form
      const form = document.getElementById("upload-doc-form");
      form.elements["document_type"].value = doc.document_type;
      form.elements["document_no"].value = doc.document_no;
      form.elements["issue_date"].value = doc.issue_date.split("T")[0];
      form.elements["expiry_date"].value = doc.expiry_date.split("T")[0];
      form.elements["documentFile"].required = false; // Optional on edit
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
        setUploadFeedback({
          message: "Document successfully updated!",
          isError: false,
        });
      } else {
        // POST
        const data = await apiFetch(`/api/vehicles/${vehicleId}/documents`, {
          method: "POST",
          body: formData,
        });
        setDocuments((prev) => [data.document, ...prev]);
        setShowDocuments(true);
        setUploadFeedback({
          message: "Document successfully added!",
          isError: false,
        });
      }
      formElement.reset();
      formElement.elements["documentFile"].required = true;
      setEditDocumentId(null);
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
        <Typography color="text.secondary">
          Loading vehicle details...
        </Typography>
        {/* DELETE CONFIRMATION MODAL */}
        <Dialog
          open={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>
            Confirm Deletion
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to permanently delete this document? This
              action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setDeleteConfirmId(null)} color="inherit">
              Cancel
            </Button>
            <Button variant="contained" color="error" onClick={executeDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
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
      <Card
        elevation={0}
        sx={{ border: 1, borderColor: "divider", overflow: "visible" }}
      >
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
            label={
              vehicle.condition_status
                ? vehicle.condition_status.replace("_", " ")
                : "Unknown"
            }
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
              <InfoItem
                label="Registration Number"
                value={vehicle.registration_no}
              />
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
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {/* Current Assignment */}
          <Card
            elevation={0}
            sx={{ border: 1, borderColor: "divider", height: "100%" }}
          >
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
                <Avatar
                  sx={{ bgcolor: "background.paper", color: "text.secondary" }}
                >
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    display="block"
                  >
                    CURRENT DRIVER
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    color="text.primary"
                  >
                    {vehicle.driver_name || "Unassigned"}
                  </Typography>
                </Box>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Service Information */}
          <Card
            elevation={0}
            sx={{ border: 1, borderColor: "divider", height: "100%" }}
          >
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
                        ? new Date(
                            vehicle.last_service_date,
                          ).toLocaleDateString()
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

      {/* Document Viewer (Collapsible) */}
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
                {documents.length} document{documents.length !== 1 ? "s" : ""}{" "}
                on file.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => setShowDocuments(!showDocuments)}
            >
              {showDocuments ? "Hide Documents" : "View Documents"}
            </Button>
          </Box>

          {showDocuments && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}
            >
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
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                              }}
                            >
                              <DescriptionIcon sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="caption" display="block">
                                PDF
                              </Typography>
                            </Box>
                          ) : (
                            <Box
                              component="img"
                              src={`http://localhost:5000${doc.document_url}`}
                              alt={doc.document_type}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          )
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No Image
                          </Typography>
                        )}
                      </Box>

                      {/* Document Details */}
                      <Box sx={{ flex: 1, width: "100%" }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{ textTransform: "uppercase" }}
                          >
                            {doc.document_type.replace("_", " ")}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            {isExpired && (
                              <Chip
                                label="EXPIRED"
                                color="error"
                                size="small"
                                sx={{ fontWeight: 700 }}
                              />
                            )}
                            <IconButton
                              onClick={() => handleEditClick(doc)}
                              color="primary"
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Box>
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <InfoItem
                              label="Doc Number"
                              value={doc.document_no}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <InfoItem
                              label="Alert"
                              value={doc.alert_triggered ? "Yes" : "No"}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <InfoItem
                              label="Issue Date"
                              value={new Date(
                                doc.issue_date,
                              ).toLocaleDateString()}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <InfoItem
                              label="Expiry Date"
                              value={new Date(
                                doc.expiry_date,
                              ).toLocaleDateString()}
                            />
                          </Grid>
                        </Grid>

                        {doc.document_url && (
                          <Button
                            href={`http://localhost:5000${doc.document_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<OpenInNewIcon />}
                            size="small"
                            sx={{ mt: 2 }}
                          >
                            Open Document
                          </Button>
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

      {/* Upload Document Section */}
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>
            {editDocumentId ? "Edit Document" : "Upload New Document"}
          </Typography>

          <form id="upload-doc-form" onSubmit={handleDocumentSubmit}>
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
                  InputLabelProps={{ shrink: true }}
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
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Upload Scan/Image"
                  name="documentFile"
                  type="file"
                  inputProps={{ accept: "image/*,.pdf" }}
                  required
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={uploading}
                  fullWidth
                >
                  {uploading
                    ? "Saving..."
                    : editDocumentId
                      ? "Update Document"
                      : "Save Document"}
                </Button>
                {editDocumentId && (
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => setDeleteConfirmId(editDocumentId)}
                    >
                      Delete Document
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => {
                        document.getElementById("upload-doc-form").reset();
                        document.getElementById("upload-doc-form").elements[
                          "documentFile"
                        ].required = true;
                        setEditDocumentId(null);
                      }}
                    >
                      Cancel Edit
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          </form>

          {uploadFeedback.message && (
            <Alert
              severity={uploadFeedback.isError ? "error" : "success"}
              sx={{ mt: 2 }}
            >
              {uploadFeedback.message}
            </Alert>
          )}
        </CardContent>
      </Card>
      {/* DELETE CONFIRMATION MODAL */}
      <Dialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete this document? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteConfirmId(null)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={executeDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function InfoItem({ label, value, sx }) {
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
      <Typography variant="body1" fontWeight={500} color="text.primary" sx={sx}>
        {value !== null && value !== undefined && value !== "" ? value : "-"}
      </Typography>
    </Box>
  );
}

export default VehicleDetails;
