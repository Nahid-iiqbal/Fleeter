import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Paper,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  Switch,
  Divider,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import MessagesPopover from "../components/MessagesPopover";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import DeleteIcon from "@mui/icons-material/Delete";
import SecurityIcon from "@mui/icons-material/Security";
import BarChartIcon from "@mui/icons-material/BarChart";
import BuildIcon from "@mui/icons-material/Build";
import HistoryIcon from "@mui/icons-material/History";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState("overview");

  // Users data
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalOwners, setTotalOwners] = useState(0);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");

  const securityLogs = [
    {
      timestamp: "Just now",
      eventType: "AUTH_LOGIN",
      user: "Admin (You)",
      ipAddress: "192.168.1.42",
      details: "Successful login via portal.",
      color: "warning",
    },
    {
      timestamp: "10 mins ago",
      eventType: "USER_CREATED",
      user: "System",
      ipAddress: "N/A",
      details: "New user 'johndoe' registered as driver.",
      color: "info",
    },
    {
      timestamp: "1 hr ago",
      eventType: "FAILED_LOGIN",
      user: "Unknown",
      ipAddress: "45.33.12.9",
      details: "Invalid credentials for 'admin'.",
      color: "error",
    },
    {
      timestamp: "2 hrs ago",
      eventType: "SYS_UPDATE",
      user: "System",
      ipAddress: "Internal",
      details: "Database backup completed successfully.",
      color: "success",
    },
  ];
  const normalizedLogSearch = logSearchQuery.trim().toLowerCase();
  const filteredSecurityLogs = securityLogs.filter((log) =>
    Object.values(log)
      .join(" ")
      .toLowerCase()
      .includes(normalizedLogSearch),
  );

  // Manage User Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [manageRole, setManageRole] = useState("");
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [manageError, setManageError] = useState("");

  const fetchData = async () => {
    try {
      await apiFetch("/api/auth/account");

      const users = await apiFetch("/api/admin/roster");
      setUsersList(users);
      setTotalUsers(users.length);
      setTotalOwners(users.filter((u) => u.role === "owner").length);
      setTotalDrivers(users.filter((u) => u.role === "driver").length);
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openManageModal = (user) => {
    setSelectedUser(user);
    setManageRole(user.role);
    setManageError("");
    setIsManageOpen(true);
  };

  const handleUpdateRole = async () => {
    try {
      await apiFetch(`/api/admin/users/${selectedUser.user_id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: manageRole }),
      });
      setIsManageOpen(false);
      fetchData(); // refresh list
    } catch (e) {
      setManageError(e.message || "Failed to update role");
    }
  };

  const handleDeleteUser = async () => {
    if (
      !window.confirm(
        `Are you absolutely sure you want to permanently delete user ${selectedUser.username}?`,
      )
    )
      return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/admin/users/${selectedUser.user_id}`, {
        method: "DELETE",
      });
      setIsManageOpen(false);
      fetchData();
    } catch (e) {
      setManageError(e.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box
      sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}
    >
      <Drawer
        variant="permanent"
        sx={{
          width: 260,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: 260, boxSizing: "border-box" },
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight={900}
              sx={{
                fontFamily: '"Passero One", cursive',
                background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: 2,
                lineHeight: 1,
              }}
            >
              FLEETER
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ letterSpacing: 1, textTransform: "uppercase" }}
          >
            Admin Portal
          </Typography>
        </Box>

        <List sx={{ flexGrow: 1, pt: 0 }}>
          <Typography
            variant="caption"
            sx={{ px: 2, color: "text.secondary", fontWeight: "bold" }}
          >
            DASHBOARD
          </Typography>
          <ListItem disablePadding>
            <ListItemButton
              selected={currentTab === "overview"}
              onClick={() => setCurrentTab("overview")}
            >
              <DashboardIcon
                sx={{
                  mr: 2,
                  color:
                    currentTab === "overview"
                      ? "primary.main"
                      : "text.secondary",
                }}
              />
              <ListItemText primary="System Overview" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={currentTab === "analytics"}
              onClick={() => setCurrentTab("analytics")}
            >
              <BarChartIcon
                sx={{
                  mr: 2,
                  color:
                    currentTab === "analytics"
                      ? "primary.main"
                      : "text.secondary",
                }}
              />
              <ListItemText primary="Platform Analytics" />
            </ListItemButton>
          </ListItem>

          <Typography
            variant="caption"
            sx={{
              px: 2,
              color: "text.secondary",
              fontWeight: "bold",
              mt: 2,
              display: "block",
            }}
          >
            MANAGEMENT
          </Typography>
          <ListItem disablePadding>
            <ListItemButton
              selected={currentTab === "users"}
              onClick={() => setCurrentTab("users")}
            >
              <GroupIcon
                sx={{
                  mr: 2,
                  color:
                    currentTab === "users" ? "primary.main" : "text.secondary",
                }}
              />
              <ListItemText primary="Universal Roster" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={currentTab === "logs"}
              onClick={() => setCurrentTab("logs")}
            >
              <HistoryIcon
                sx={{
                  mr: 2,
                  color:
                    currentTab === "logs" ? "primary.main" : "text.secondary",
                }}
              />
              <ListItemText primary="System Logs" />
            </ListItemButton>
          </ListItem>

          <Typography
            variant="caption"
            sx={{
              px: 2,
              color: "text.secondary",
              fontWeight: "bold",
              mt: 2,
              display: "block",
            }}
          >
            SYSTEM
          </Typography>
          <ListItem disablePadding>
            <ListItemButton
              selected={currentTab === "settings"}
              onClick={() => setCurrentTab("settings")}
            >
              <BuildIcon
                sx={{
                  mr: 2,
                  color:
                    currentTab === "settings"
                      ? "primary.main"
                      : "text.secondary",
                }}
              />
              <ListItemText primary="Global Config" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <AppBar
          position="static"
          color="default"
          elevation={0}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              {currentTab === "overview" && "System Overview"}
              {currentTab === "analytics" && "Platform Analytics"}
              {currentTab === "users" && "Universal Roster"}
              {currentTab === "logs" && "System Logs"}
              {currentTab === "settings" && "Global Configuration"}
            </Typography>

            <MessagesPopover />
            <Tooltip title="Logout">
              <IconButton color="error" onClick={handleLogout} size="small">
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, md: 4 }, overflowY: "auto", flexGrow: 1 }}>
          {currentTab === "overview" && (
            <Box>
              <Grid container spacing={3} mb={4} alignItems="stretch">
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <Paper
                    sx={{
                      p: 3,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      borderTop: "4px solid",
                      borderColor: "success.main",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      fontWeight={700}
                    >
                      Platform State
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight="900"
                      color="success.main"
                    >
                      🟢 ONLINE
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <Paper
                    sx={{
                      p: 3,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      borderTop: "4px solid",
                      borderColor: "primary.main",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      fontWeight={700}
                    >
                      Total Users
                    </Typography>
                    <Typography variant="h4" fontWeight="900">
                      {totalUsers}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <Paper
                    sx={{
                      p: 3,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      borderTop: "4px solid",
                      borderColor: "secondary.main",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      fontWeight={700}
                    >
                      Active Fleets
                    </Typography>
                    <Typography variant="h4" fontWeight="900">
                      {totalOwners}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <Paper
                    sx={{
                      p: 3,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      borderTop: "4px solid",
                      borderColor: "warning.main",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      fontWeight={700}
                    >
                      Global Drivers
                    </Typography>
                    <Typography variant="h4" fontWeight="900">
                      {totalDrivers}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  System Integrity Check
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  <Alert severity="success">
                    Database connection is stable. Latency: 12ms
                  </Alert>
                  <Alert severity="success">
                    Authentication services are fully operational.
                  </Alert>
                  <Alert severity="info">
                    Background worker tasks are currently sleeping.
                  </Alert>
                </Box>
              </Paper>
            </Box>
          )}

          {currentTab === "analytics" && (
            <Box>
              <Typography variant="h5" fontWeight={700} mb={3}>
                Platform Traffic & Load
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      height: 350,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700} mb={3}>
                      Hourly API Requests (Mock)
                    </Typography>
                    <Box
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 1,
                        height: "100%",
                      }}
                    >
                      {[40, 60, 20, 80, 50, 100, 70, 90, 60, 80, 40, 55].map(
                        (h, i) => (
                          <Box
                            key={i}
                            sx={{
                              flex: 1,
                              bgcolor: "primary.main",
                              height: `${h}%`,
                              borderRadius: "4px 4px 0 0",
                              opacity: 0.8,
                              transition: "0.2s",
                              "&:hover": {
                                opacity: 1,
                                bgcolor: "secondary.main",
                              },
                            }}
                          />
                        ),
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        12 AM
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        12 PM
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: 350 }}>
                    <Typography variant="subtitle1" fontWeight={700} mb={3}>
                      Resource Usage
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          CPU Load
                        </Typography>
                        <Typography
                          variant="body2"
                          color="error.main"
                          fontWeight={700}
                        >
                          82%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: "100%",
                          bgcolor: "divider",
                          height: 8,
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            width: "82%",
                            bgcolor: "error.main",
                            height: "100%",
                          }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          Memory (RAM)
                        </Typography>
                        <Typography
                          variant="body2"
                          color="warning.main"
                          fontWeight={700}
                        >
                          64%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: "100%",
                          bgcolor: "divider",
                          height: 8,
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            width: "64%",
                            bgcolor: "warning.main",
                            height: "100%",
                          }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          Database Storage
                        </Typography>
                        <Typography
                          variant="body2"
                          color="success.main"
                          fontWeight={700}
                        >
                          14%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: "100%",
                          bgcolor: "divider",
                          height: 8,
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            width: "14%",
                            bgcolor: "success.main",
                            height: "100%",
                          }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {currentTab === "users" && (
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Universal Roster ({filteredUsers.length})
                </Typography>
                <TextField
                  size="small"
                  placeholder="Search username, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ width: 300 }}
                />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Association
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.user_id} hover>
                        <TableCell>{user.user_id}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {user.username}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={user.role.toUpperCase()}
                            color={
                              user.role === "admin"
                                ? "error"
                                : user.role === "owner"
                                  ? "secondary"
                                  : user.role === "driver"
                                    ? "primary"
                                    : "default"
                            }
                            sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 200 }}
                          >
                            {user.company_name && `🏢 ${user.company_name}`}
                            {user.driver_name &&
                              `🚚 Driver: ${user.driver_name}`}
                            {!user.company_name && !user.driver_name && "—"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={() => openManageModal(user)}
                            sx={{ textTransform: "none", fontWeight: 600 }}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No users found matching "{searchQuery}"
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {currentTab === "logs" && (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  System Security Logs
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <TextField
                    size="small"
                    placeholder="Search logs..."
                    value={logSearchQuery}
                    onChange={(event) => setLogSearchQuery(event.target.value)}
                  />
                  <Button size="small" variant="outlined">
                    Export CSV
                  </Button>
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Event Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>User ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSecurityLogs.map((log) => (
                      <TableRow hover key={`${log.timestamp}-${log.eventType}`}>
                        <TableCell>{log.timestamp}</TableCell>
                        <TableCell>
                          <Chip size="small" color={log.color} label={log.eventType} />
                        </TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                        <TableCell>{log.details}</TableCell>
                      </TableRow>
                    ))}
                    {filteredSecurityLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No logs found matching "{logSearchQuery}"
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {currentTab === "settings" && (
            <Box sx={{ maxWidth: "600px" }}>
              <Typography variant="h5" fontWeight={700} mb={3}>
                Global Configuration
              </Typography>
              <Card
                elevation={0}
                sx={{ border: 1, borderColor: "divider", mb: 3 }}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    Access Control
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Allow New Registrations
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Users can sign up from the landing page.
                      </Typography>
                    </Box>
                    <Switch defaultChecked color="success" />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Maintenance Mode
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Locks out all non-admin users immediately.
                      </Typography>
                    </Box>
                    <Switch color="error" />
                  </Box>
                </CardContent>
              </Card>
              <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    Security Limits
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="Max Failed Logins"
                      type="number"
                      defaultValue={5}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Session Timeout (mins)"
                      type="number"
                      defaultValue={120}
                      size="small"
                      fullWidth
                    />
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3, fontWeight: 700 }}
                  >
                    Apply Changes
                  </Button>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Box>

      {/* User Management Modal */}
      <Dialog
        open={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>
              Manage User: {selectedUser.username}
            </DialogTitle>
            <DialogContent dividers>
              {manageError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {manageError}
                </Alert>
              )}

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>
                  Change System Role
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Warning: Changing a user's role may severely impact their
                  ability to access fleets and data.
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Select
                    size="small"
                    fullWidth
                    value={manageRole}
                    onChange={(e) => setManageRole(e.target.value)}
                  >
                    <MenuItem value="admin">System Admin</MenuItem>
                    <MenuItem value="owner">Fleet Owner</MenuItem>
                    <MenuItem value="manager">Fleet Manager</MenuItem>
                    <MenuItem value="driver">Driver</MenuItem>
                    <MenuItem value="user">Basic User (Unverified)</MenuItem>
                  </Select>
                  <Button
                    variant="contained"
                    onClick={handleUpdateRole}
                    disabled={manageRole === selectedUser.role}
                  >
                    Update Role
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color="error.main"
                  mb={1}
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <SecurityIcon fontSize="small" /> Danger Zone
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Permanently delete this user account. This action cannot be
                  undone and will cascade delete all associated data (documents,
                  history).
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete User"}
                </Button>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setIsManageOpen(false)}
                color="inherit"
                sx={{ fontWeight: 600 }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
