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
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";

function ManagersTable({
  managers = [],
  managersLoading,
  error,
  onRefresh,
  onManagerClick,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredManagers = managers.filter((manager) =>
    [
      manager.manager_id,
      manager.full_name,
      manager.employee_id,
      manager.phone,
      manager.department,
      manager.username,
      manager.email,
      manager.is_active ? "active" : "inactive",
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
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Manager Management
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
            placeholder="Search managers..."
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
            disabled={managersLoading}
            startIcon={
              managersLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshIcon />
              )
            }
            sx={{ whiteSpace: "nowrap", height: 40, minWidth: "120px" }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Feedback */}
      {error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        {managersLoading ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography>Loading managers...</Typography>
          </Box>
        ) : managers.length === 0 && !error ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography>No managers found.</Typography>
          </Box>
        ) : filteredManagers.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography>No managers match your search.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: "background.default" }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredManagers.map((manager) => (
                  <TableRow key={manager.manager_id} hover>
                    <TableCell>{manager.manager_id}</TableCell>
                    <TableCell>
                      <Button
                        variant="text"
                        color="primary"
                        onClick={() => onManagerClick(manager.manager_id)}
                        sx={{
                          fontWeight: 600,
                          p: 0,
                          minWidth: "auto",
                          textTransform: "none",
                          textAlign: "left",
                        }}
                      >
                        {manager.full_name}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={
                          manager.employee_id
                            ? "text.primary"
                            : "text.secondary"
                        }
                      >
                        {manager.employee_id || "Not provided"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={
                          manager.department ? "text.primary" : "text.secondary"
                        }
                        sx={{ textTransform: "capitalize" }}
                      >
                        {manager.department || "Not provided"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={
                          manager.username || manager.email
                            ? "text.primary"
                            : "text.secondary"
                        }
                      >
                        {manager.username || manager.email || "Not linked"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={
                          manager.phone ? "text.primary" : "text.secondary"
                        }
                      >
                        {manager.phone || "Not provided"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={manager.is_active ? "Active" : "Inactive"}
                        color={manager.is_active ? "success" : "default"}
                        size="small"
                        sx={{ fontWeight: 600 }}
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

export default ManagersTable;
