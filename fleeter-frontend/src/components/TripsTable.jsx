import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Grid,
  MenuItem,
  Autocomplete,
  Alert,
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";

import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MapIcon from "@mui/icons-material/Map";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";


function defaultDeparture() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function TripsTable({
  trips = [],
  tripsLoading,
  drivers,
  vehicles,
  onRefresh,
  onDriverClick,
  onVehicleClick,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const [routeMapOpen, setRouteMapOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [telemetryPath, setTelemetryPath] = useState([]);
  const [telemetryLoading, setTelemetryLoading] = useState(false);

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

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [tripFormState, setTripFormState] = useState({
    driver_id: "",
    vehicle_id: "",
    route_id: "",
    route_name: "",
    custom_route: false,
    origin_address: "",
    destination_address: "",
    departure_time: defaultDeparture(),
    cargo_type: "cargo",
    notes: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    const loadRoutes = async () => {
      try {
        setLoading(true);
        setRoutes(await apiFetch("/api/company/routes"));
      } catch (loadError) {
        setError(loadError.message || "Unable to load routes.");
      } finally {
        setLoading(false);
      }
    };
    loadRoutes();
  }, [isOpen]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setTripFormState((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!tripFormState.driver_id || !tripFormState.vehicle_id) {
      setError("Select a driver and vehicle from the search results.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await apiFetch("/api/company/trips", {
        method: "POST",
        body: JSON.stringify(tripFormState),
      });
      setIsOpen(false);
      onRefresh();
    } catch (submitError) {
      setError(submitError.message || "Unable to add trip.");
    } finally {
      setLoading(false);
    }
  };

  const normalizedTableSearch = tableSearch.trim().toLowerCase();
  const filteredTrips = trips.filter((trip) =>
    [
      trip.origin,
      trip.destination,
      trip.driver_name,
      trip.registration_no,
      trip.cargo_type,
      trip.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedTableSearch),
  );
  const grouped = {
    in_progress: filteredTrips.filter((trip) => trip.status === "in_progress"),
    scheduled: filteredTrips.filter((trip) => trip.status === "scheduled"),
    completed: filteredTrips.filter((trip) => trip.status === "completed"),
  };

  const getStatusColor = (status) => {
    if (status === "in_progress") return "info";
    if (status === "completed") return "success";
    if (status === "scheduled") return "warning";
    return "default";
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Trip Management
        </Typography>
        <TextField
          size="small"
          placeholder="Search trips..."
          value={tableSearch}
          onChange={(event) => setTableSearch(event.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 220 } }}
        />
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={onRefresh}
            disabled={tripsLoading}
            startIcon={
              tripsLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshIcon />
              )
            }
            sx={{ whiteSpace: "nowrap", height: 40, minWidth: "140px" }}
          >
            Refresh trips
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />} sx={{ height: 40, whiteSpace: "nowrap", minWidth: "max-content" }}
            onClick={() => {
              setError("");
              setTripFormState((current) => ({
                ...current,
                departure_time: defaultDeparture(),
              }));
              setIsOpen(true);
            }}
          >
            Add trip
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ width: "100%", overflowX: "auto", p: 0 }}>
        {tripsLoading ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography>Loading trips...</Typography>
          </Box>
        ) : trips.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography>No trips found.</Typography>
          </Box>
        ) : (
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 4 }}>
            {["in_progress", "scheduled", "completed"].map((status) => (
              <Box key={status}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", letterSpacing: 1, mb: 2 }}
                >
                  {status.replace("_", " ")}
                </Typography>

                {grouped[status].length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No {status.replace("_", " ")} trips.
                  </Typography>
                ) : (
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}
                  >
                    <Table sx={{ minWidth: 800 }} size="small">
                      <TableHead sx={{ bgcolor: "background.default" }}>
                        <TableRow>
                          <TableCell>Route</TableCell>
                          <TableCell>Driver</TableCell>
                          <TableCell>Vehicle</TableCell>
                          <TableCell>Cargo type</TableCell>
                          <TableCell>Departure</TableCell>
                          <TableCell>Arrival</TableCell>
                          <TableCell align="right">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {grouped[status].map((trip) => (
                          <TableRow key={trip.trip_id} hover>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" fontWeight={500}>
                                    {trip.origin} ➔ {trip.destination}
                                  </Typography>
                                  <IconButton size="small" onClick={() => handleOpenRouteMap(trip.trip_id)} color="primary">
                                    <MapIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            <TableCell>
                              <Button
                                variant="text"
                                color="primary"
                                onClick={() => onDriverClick(trip.driver_id)}
                                sx={{
                                  fontWeight: 600,
                                  p: 0,
                                  minWidth: "auto",
                                  textTransform: "none",
                                }}
                              >
                                {trip.driver_name}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="text"
                                color="primary"
                                onClick={() => onVehicleClick(trip.vehicle_id)}
                                sx={{
                                  fontWeight: 600,
                                  p: 0,
                                  minWidth: "auto",
                                  textTransform: "none",
                                }}
                              >
                                {trip.registration_no}
                              </Button>
                            </TableCell>
                            <TableCell sx={{ textTransform: "capitalize" }}>
                              {trip.cargo_type || "Not specified"}
                            </TableCell>
                            <TableCell>
                              {new Date(trip.departure_time).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {trip.arrival_time
                                ? new Date(trip.arrival_time).toLocaleString()
                                : "-"}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={status.replace("_", " ")}
                                color={getStatusColor(status)}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  textTransform: "capitalize",
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      
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

      {/* Add Trip Dialog */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Add trip
          </Typography>
        </DialogTitle>
        <form onSubmit={submit}>
          <DialogContent dividers>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Autocomplete
                options={drivers.filter(d => d.status === "available")}
                getOptionLabel={(driver) => driver.full_name}
                inputValue={driverSearch}
                onInputChange={(_, newInputValue) =>
                  setDriverSearch(newInputValue)
                }
                onChange={(_, newValue) => {
                  setTripFormState((prev) => ({
                    ...prev,
                    driver_id: newValue ? String(newValue.driver_id) : "",
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search drivers"
                    placeholder="By driver name"
                    required
                  />
                )}
              />

              <Autocomplete
                options={vehicles.filter(v => v.availability_status === "available")}
                getOptionLabel={(vehicle) =>
                  `${vehicle.registration_no} (${vehicle.brand} ${vehicle.model})`
                }
                inputValue={vehicleSearch}
                onInputChange={(_, newInputValue) =>
                  setVehicleSearch(newInputValue)
                }
                onChange={(_, newValue) => {
                  setTripFormState((prev) => ({
                    ...prev,
                    vehicle_id: newValue ? String(newValue.vehicle_id) : "",
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search vehicles"
                    placeholder="By registration, brand, or model"
                    required
                  />
                )}
              />

              <TextField
                label="Existing route"
                select
                name="route_id"
                value={tripFormState.route_id}
                onChange={update}
                disabled={tripFormState.custom_route}
                required={!tripFormState.custom_route}
                fullWidth
              >
                <MenuItem value="" disabled>
                  Select a route
                </MenuItem>
                {routes.map((route) => (
                  <MenuItem key={route.route_id} value={route.route_id}>
                    {route.route_name}: {route.origin} to {route.destination}
                  </MenuItem>
                ))}
              </TextField>

              <FormControlLabel
                control={
                  <Checkbox
                    name="custom_route"
                    checked={tripFormState.custom_route}
                    onChange={update}
                  />
                }
                label="Add custom trip addresses as a route"
              />

              {tripFormState.custom_route && (
                <>
                  <TextField
                    label="Route name"
                    name="route_name"
                    value={tripFormState.route_name}
                    onChange={update}
                    required
                    slotProps={{ htmlInput: { maxLength: 100 } }}
                    fullWidth
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Origin address"
                        name="origin_address"
                        value={tripFormState.origin_address}
                        onChange={update}
                        required
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Destination address"
                        name="destination_address"
                        value={tripFormState.destination_address}
                        onChange={update}
                        required
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </>
              )}

              <TextField
                label="Departure time"
                type="datetime-local"
                name="departure_time"
                value={tripFormState.departure_time}
                onChange={update}
                required
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />

              <TextField
                label="Cargo or passengers"
                select
                name="cargo_type"
                value={tripFormState.cargo_type}
                onChange={update}
                required
                fullWidth
              >
                <MenuItem value="cargo">Cargo</MenuItem>
                <MenuItem value="passengers">Passengers</MenuItem>
              </TextField>

              <TextField
                label="Notes"
                name="notes"
                value={tripFormState.notes}
                onChange={update}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button
              onClick={() => setIsOpen(false)}
              color="inherit"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add trip"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
}

export default TripsTable;
