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
  InputAdornment,
  Autocomplete,
  Alert,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";

const getDriverStatusColor = (status) => {
  const normalizedStatus = String(status || "")
    .toLowerCase()
    .replaceAll("_", " ");
  if (normalizedStatus === "available") return "success";
  if (normalizedStatus === "dispatched") return "default";
  if (normalizedStatus === "on leave") return "error";
  return "default";
};

function DriversTable({
  drivers,
  driversLoading,
  error,
  onRefresh,
  onDriverClick,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigningDriver, setAssigningDriver] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [routeSearch, setRouteSearch] = useState("");
  const [tripLoading, setTripLoading] = useState(false);
  const [tripError, setTripError] = useState("");
  const [tripForm, setTripForm] = useState({
    vehicle_id: "",
    route_id: "",
    route_name: "",
    origin_address: "",
    destination_address: "",
    custom_route: false,
    departure_time: getDefaultDepartureTime(),
    cargo_type: "cargo",
    notes: "",
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredDrivers = drivers.filter((driver) => {
    const searchMatch = [
      driver.driver_id,
      driver.full_name,
      driver.document_no,
      driver.document_type,
      driver.username,
      driver.email,
      driver.phone,
      driver.status,
      driver.joined_date,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
    const statusMatch = statusFilter === "all" || driver.status === statusFilter;
    return searchMatch && statusMatch;
  });

  useEffect(() => {
    if (!assigningDriver) {
      return;
    }

    const loadTripOptions = async () => {
      try {
        setTripLoading(true);
        setTripError("");
        const [routeData, vehicleData] = await Promise.all([
          apiFetch("/api/company/routes"),
          apiFetch("/api/vehicles"),
        ]);
        setRoutes(routeData);
        setVehicles(vehicleData);
        setTripForm((current) => ({
          ...current,
          vehicle_id:
            current.vehicle_id || String(vehicleData[0]?.vehicle_id || ""),
          route_id: current.route_id || String(routeData[0]?.route_id || ""),
        }));
        setVehicleSearch(
          (current) => current || getVehicleLabel(vehicleData[0]),
        );
        setRouteSearch((current) => current || getRouteLabel(routeData[0]));
      } catch (loadError) {
        setTripError(loadError.message || "Unable to load trip options.");
      } finally {
        setTripLoading(false);
      }
    };

    loadTripOptions();
  }, [assigningDriver]);

  const closeAssignment = () => {
    setAssigningDriver(null);
    setTripError("");
  };

  const submitAssignment = async (event) => {
    event.preventDefault();
    if (
      !tripForm.vehicle_id ||
      (!tripForm.custom_route && !tripForm.route_id)
    ) {
      setTripError("Select a vehicle and route from the search results.");
      return;
    }
    try {
      setTripLoading(true);
      setTripError("");
      await apiFetch("/api/company/trips", {
        method: "POST",
        body: JSON.stringify({
          ...tripForm,
          driver_id: assigningDriver.driver_id,
        }),
      });
      closeAssignment();
      onRefresh();
    } catch (submitError) {
      setTripError(submitError.message || "Unable to assign trip.");
    } finally {
      setTripLoading(false);
    }
  };

  const updateTripField = (event) => {
    const { name, value, type, checked } = event.target;
    setTripForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
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
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Driver Management
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexGrow: 1,
            justifyContent: "flex-end",
            maxWidth: { xs: "100%", md: "600px" },
          }}
        >
          <TextField
            select
            size="small"
            label="Filter Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="dispatched">Dispatched</MenuItem>
            <MenuItem value="on_leave">On Leave</MenuItem>
          </TextField>
          <TextField
            size="small"
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={onRefresh}
            disabled={driversLoading}
            startIcon={
              driversLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshIcon />
              )
            }
            sx={{ whiteSpace: "nowrap" , px: 5}}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Visible Error Feedback Box */}
      {error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {/* Loading & Empty States */}
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        {driversLoading ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography>Loading drivers...</Typography>
          </Box>
        ) : drivers.length === 0 && !error ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography>No drivers found.</Typography>
          </Box>
        ) : filteredDrivers.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography>No drivers match your search.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: "background.default" }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>License Document</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.driver_id} hover>
                    <TableCell>{driver.driver_id}</TableCell>
                    <TableCell>
                      <Button
                        variant="text"
                        color="primary"
                        onClick={() => onDriverClick(driver.driver_id)}
                        sx={{
                          fontWeight: 600,
                          p: 0,
                          minWidth: "auto",
                          textTransform: "none",
                          textAlign: "left",
                        }}
                      >
                        {driver.full_name}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {driver.document_no || "Not provided"}
                      </Typography>
                      {driver.document_type && (
                        <Typography variant="caption" color="text.secondary">
                          Type: {driver.document_type.replaceAll("_", " ")}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {driver.username || driver.email || "Not linked"}
                      </Typography>
                      {driver.email && driver.username && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {driver.email}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={driver.status}
                        color={getDriverStatusColor(driver.status)}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: "capitalize" }}
                      />
                    </TableCell>
                    <TableCell>
                      {driver.joined_date
                        ? new Date(driver.joined_date).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        disabled={driver.status !== "available"}
                        onClick={() => {
                          setTripForm((current) => ({
                            ...current,
                            departure_time: getDefaultDepartureTime(),
                          }));
                          setAssigningDriver(driver);
                        }}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        Assign trip
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Assign Trip Dialog */}
      <Dialog
        open={!!assigningDriver}
        onClose={closeAssignment}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Assign trip
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Driver: {assigningDriver?.full_name}
          </Typography>
        </DialogTitle>
        <form onSubmit={submitAssignment}>
          <DialogContent dividers>
            {tripError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {tripError}
              </Alert>
            )}

            {tripLoading && routes.length === 0 && vehicles.length === 0 ? (
              <Box sx={{ textAlign: "center", p: 3 }}>
                <CircularProgress />
                <Typography mt={1}>Loading trip options...</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Autocomplete
                  options={vehicles}
                  getOptionLabel={getVehicleLabel}
                  inputValue={vehicleSearch}
                  onInputChange={(_, newInputValue) =>
                    setVehicleSearch(newInputValue)
                  }
                  onChange={(_, newValue) => {
                    setTripForm((prev) => ({
                      ...prev,
                      vehicle_id: newValue ? String(newValue.vehicle_id) : "",
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search vehicles"
                      placeholder="Registration, brand, or model"
                      required
                    />
                  )}
                />

                <Autocomplete
                  options={routes}
                  getOptionLabel={getRouteLabel}
                  inputValue={routeSearch}
                  onInputChange={(_, newInputValue) =>
                    setRouteSearch(newInputValue)
                  }
                  onChange={(_, newValue) => {
                    setTripForm((prev) => ({
                      ...prev,
                      route_id: newValue ? String(newValue.route_id) : "",
                    }));
                  }}
                  disabled={tripForm.custom_route}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search routes"
                      placeholder="Route name, origin, or destination"
                      required={!tripForm.custom_route}
                    />
                  )}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      name="custom_route"
                      checked={tripForm.custom_route}
                      onChange={updateTripField}
                    />
                  }
                  label="Add custom trip addresses as a route"
                />

                {tripForm.custom_route && (
                  <>
                    <TextField
                      label="Route name"
                      name="route_name"
                      value={tripForm.route_name}
                      onChange={updateTripField}
                      required
                      inputProps={{ maxLength: 100 }}
                      fullWidth
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Origin address"
                          name="origin_address"
                          value={tripForm.origin_address}
                          onChange={updateTripField}
                          required
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Destination address"
                          name="destination_address"
                          value={tripForm.destination_address}
                          onChange={updateTripField}
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
                  value={tripForm.departure_time}
                  onChange={updateTripField}
                  required
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <TextField
                  label="Cargo or passengers"
                  select
                  name="cargo_type"
                  value={tripForm.cargo_type}
                  onChange={updateTripField}
                  required
                  fullWidth
                >
                  <MenuItem value="cargo">Cargo</MenuItem>
                  <MenuItem value="passengers">Passengers</MenuItem>
                </TextField>

                <TextField
                  label="Notes"
                  name="notes"
                  value={tripForm.notes}
                  onChange={updateTripField}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button
              onClick={closeAssignment}
              color="inherit"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={tripLoading}
            >
              {tripLoading ? "Assigning..." : "Assign trip"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
}

function getDefaultDepartureTime() {
  const departure = new Date(Date.now() + 60 * 60 * 1000);
  departure.setMinutes(departure.getMinutes() - departure.getTimezoneOffset());
  return departure.toISOString().slice(0, 16);
}

function getVehicleLabel(vehicle) {
  return vehicle
    ? `${vehicle.registration_no} (${vehicle.brand} ${vehicle.model})`
    : "";
}

function getRouteLabel(route) {
  return route
    ? `${route.route_name}: ${route.origin} to ${route.destination}`
    : "";
}

export default DriversTable;
