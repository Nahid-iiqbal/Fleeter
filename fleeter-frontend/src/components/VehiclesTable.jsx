import React, { useState } from "react";
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
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddVehicleDialog from "./AddVehicleDialog";

const getVehicleStatusColor = (status) => {
  const normalizedStatus = String(status || "")
    .toLowerCase()
    .replaceAll("_", " ");
  if (normalizedStatus === "available") return "success";
  if (normalizedStatus === "dispatched") return "default";
  if (normalizedStatus === "unavailable") return "error";
  return "default";
};

function VehiclesTable({
  vehicles,
  vehiclesLoading,
  onRefresh,
  onVehicleClick,
  onDriverClick,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredVehicles = vehicles.filter((vehicle) =>
    [
      vehicle.vehicle_id,
      vehicle.registration_no,
      vehicle.brand,
      vehicle.model,
      vehicle.type,
      vehicle.fuel_type,
      vehicle.current_driver_name,
      vehicle.availability_status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch),
  );

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
          Fleet Inventory
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
            size="small"
            placeholder="Search vehicles..."
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
            disabled={vehiclesLoading}
            startIcon={
              vehiclesLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshIcon />
              )
            }
            sx={{ whiteSpace: "nowrap" }}
          >
            Refresh
          </Button>
          <AddVehicleDialog onCreated={onRefresh} />
        </Box>
      </Box>

      {/* Loading & Empty States */}
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        {vehiclesLoading ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography>Loading vehicles...</Typography>
          </Box>
        ) : vehicles.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography>No vehicles found.</Typography>
          </Box>
        ) : filteredVehicles.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography>No vehicles match your search.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: "background.default" }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Registration</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Fuel</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.vehicle_id} hover>
                    <TableCell>{vehicle.vehicle_id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {vehicle.registration_no}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="text"
                        color="primary"
                        onClick={() => onVehicleClick(vehicle.vehicle_id)}
                        sx={{
                          fontWeight: 600,
                          p: 0,
                          minWidth: "auto",
                          textTransform: "none",
                          textAlign: "left",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        {vehicle.brand} {vehicle.model}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="span"
                          sx={{ textTransform: "none" }}
                        >
                          Year: {vehicle.year || "N/A"}
                        </Typography>
                      </Button>
                    </TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {vehicle.type}
                    </TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {vehicle.fuel_type}
                    </TableCell>
                    <TableCell>
                      {vehicle.current_driver_id ? (
                        <Button
                          variant="text"
                          color="primary"
                          onClick={() =>
                            onDriverClick(vehicle.current_driver_id)
                          }
                          sx={{
                            fontWeight: 600,
                            p: 0,
                            minWidth: "auto",
                            textTransform: "none",
                            textAlign: "left",
                          }}
                        >
                          {vehicle.current_driver_name}
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Unassigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={vehicle.availability_status || "Unknown"}
                        color={getVehicleStatusColor(
                          vehicle.availability_status,
                        )}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: "capitalize" }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Paper>
  );
}

export default VehiclesTable;
