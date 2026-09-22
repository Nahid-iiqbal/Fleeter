import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { useThemeSettings } from "../context/ThemeSettingsContext";
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
  Badge,
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
  Popover
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";

function AdminDashboard() {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeSettings();
  const [currentTab, setCurrentTab] = useState("overview");
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const handleNotificationsClick = (event) => setNotificationAnchorEl(event.currentTarget);
  const handleNotificationsClose = () => setNotificationAnchorEl(null);
  const isNotificationsOpen = Boolean(notificationAnchorEl);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [totalOwners, setTotalOwners] = useState(0);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accountData = await apiFetch('/api/auth/account');
        if (!accountData.full_name || !accountData.phone || !accountData.address) {
          setProfileIncomplete(true);
        }
      } catch (err) { }

      try {
        const users = await apiFetch("/api/admin/roster");
        setUsersList(users);

        setTotalUsers(users.length);
        setTotalAdmins(users.filter((u) => u.role === "admin").length);
        setTotalOwners(users.filter((u) => u.role === "owner").length);
        setTotalDrivers(users.filter((u) => u.role === "driver").length);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.company_name && u.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' },
        }}
      >
        <Box p={2} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="h6" fontWeight="bold">Fleeter OS</Typography>
          <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
            Admin Portal
          </Typography>
        </Box>
        <List sx={{ flexGrow: 1 }}>
          <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', fontWeight: 'bold' }}>DASHBOARD</Typography>
          <ListItem disablePadding>
            <ListItemButton selected={currentTab === "overview"} onClick={() => setCurrentTab("overview")}>
              <DashboardIcon sx={{ mr: 2 }} />
              <ListItemText primary="System Overview" />
            </ListItemButton>
          </ListItem>
          <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', fontWeight: 'bold', mt: 2, display: 'block' }}>MANAGEMENT</Typography>
          <ListItem disablePadding>
            <ListItemButton selected={currentTab === "users"} onClick={() => setCurrentTab("users")}>
              <GroupIcon sx={{ mr: 2 }} />
              <ListItemText primary="User Roster" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>System Administration</Typography>
            <IconButton color="inherit" onClick={handleNotificationsClick}>
              <Badge badgeContent={profileIncomplete ? 1 : 0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Popover
              open={isNotificationsOpen}
              anchorEl={notificationAnchorEl}
              onClose={handleNotificationsClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <Box p={2} minWidth={260}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Notifications</Typography>
                {profileIncomplete ? (
                  <Button
                    fullWidth
                    color="inherit"
                    sx={{ justifyContent: "flex-start", textTransform: "none", textAlign: "left", color: "warning.main" }}
                    onClick={() => { handleNotificationsClose(); navigate("/dashboard/settings"); }}
                  >
                    ⚠️ Action Required: Please complete your profile information.
                  </Button>
                ) : (
                  <Typography variant="body2" color="text.secondary">No new notifications.</Typography>
                )}
              </Box>
            </Popover>
            <IconButton color="inherit" onClick={() => navigate("/dashboard/settings")}>
              <SettingsIcon />
            </IconButton>
            <IconButton color="error" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
            <Tooltip title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton onClick={toggleTheme} sx={{ mx: 0.5 }}>
                {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton color="inherit" onClick={() => navigate("/dashboard/settings")}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout">
              <IconButton color="error" onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
          {currentTab === "overview" && (
            <Box>
              <Typography variant="h4" gutterBottom>System Overview</Typography>
              <Grid container spacing={3} mb={3} alignItems="stretch">
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <Paper sx={{ p: 3, width: "100%", minHeight: 150, display: "flex", flexDirection: "column", justifyContent: "center", borderTop: 5, borderColor: 'success.main', boxShadow: 1 }}>
                    <Typography variant="overline" color="text.secondary">Site State</Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">🟢 Online</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <Paper sx={{ p: 3, width: "100%", minHeight: 150, display: "flex", flexDirection: "column", justifyContent: "center", borderTop: 5, borderColor: 'info.main', boxShadow: 1 }}>
                    <Typography variant="overline" color="text.secondary">Total Users</Typography>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">{totalUsers}</Typography>
                    <Typography variant="caption" color="text.secondary">{totalAdmins} Site Admins</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <Paper sx={{ p: 3, width: "100%", minHeight: 150, display: "flex", flexDirection: "column", justifyContent: "center", borderTop: 5, borderColor: 'secondary.main', boxShadow: 1 }}>
                    <Typography variant="overline" color="text.secondary">Registered Companies</Typography>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">{totalOwners}</Typography>
                    <Typography variant="caption" color="text.secondary">Active Fleet Owners</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                  <Paper sx={{ p: 3, width: "100%", minHeight: 150, display: "flex", flexDirection: "column", justifyContent: "center", borderTop: 5, borderColor: 'warning.main', boxShadow: 1 }}>
                    <Typography variant="overline" color="text.secondary">Registered Drivers</Typography>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">{totalDrivers}</Typography>
                    <Typography variant="caption" color="text.secondary">Across all fleets</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {currentTab === "users" && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Universal Roster ({filteredUsers.length})</Typography>
                <TextField
                  size="small"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ width: 300 }}
                />
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Association</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>{user.user_id}</TableCell>
                        <TableCell fontWeight="bold">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={user.role.toUpperCase()}
                            color={user.role === 'admin' ? 'error' : user.role === 'owner' ? 'secondary' : 'primary'}
                          />
                        </TableCell>
                        <TableCell>
                          {user.company_name && `🏢 ${user.company_name}`}
                          {user.driver_name && `🚗 Driver: ${user.driver_name}`}
                          {!user.company_name && !user.driver_name && "Unassigned"}
                        </TableCell>
                        <TableCell>{user.driver_status || "active"}</TableCell>
                        <TableCell>
                          <Button variant="outlined" size="small" color="warning">Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default AdminDashboard;
