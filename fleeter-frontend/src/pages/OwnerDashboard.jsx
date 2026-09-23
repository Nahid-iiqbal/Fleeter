import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, AppBar, Toolbar, IconButton, Badge, Popover, Button, Paper, Tooltip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import AccountSettings from "../components/AccountSettings";
import { useThemeSettings } from "../context/ThemeSettingsContext";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MapIcon from "@mui/icons-material/Map";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PersonIcon from "@mui/icons-material/Person";
import RouteIcon from "@mui/icons-material/Route";
import GroupIcon from "@mui/icons-material/Group";
import WorkIcon from "@mui/icons-material/Work";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

// import driver and vehicle details for the details page
import DriverDetails from "./DriverDetails";
import VehicleDetails from "./VehicleDetails";
import ManagerDetails from "./ManagerDetails";
import AlertDetails from "./AlertDetails";

// import tables to show the list
import DriversTable from "../components/DriversTable";
import TripsTable from "../components/TripsTable";
import VehiclesTable from "../components/VehiclesTable";
import ManagersTable from "../components/ManagersTable";
import CompanyRequests from "../components/CompanyRequests";
import AlertsTable from "../components/AlertsTable";
import LiveMap from "../components/LiveMap";
import { apiFetch } from "../utils/api";

const DRAWER_WIDTH = 252;
function OwnerDashboard() {
  const { mode, toggleTheme } = useThemeSettings();
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const handleNotificationsClick = (event) => setNotificationAnchorEl(event.currentTarget);
  const handleNotificationsClose = () => setNotificationAnchorEl(null);
  const isNotificationsOpen = Boolean(notificationAnchorEl);

  const navigate = useNavigate();
  const location = useLocation();
  const requestedTab = location.pathname.split("/")[2];
  const activeTab =
    !requestedTab || requestedTab === "owner-dashboard"
      ? "overview"
      : requestedTab;
  const userRole = localStorage.getItem("role");
  const [companyContext, setCompanyContext] = useState(null);

  // Profile page for drivers
  const driverProfileMatch = location.pathname.match(
    /^\/dashboard\/drivers\/(\d+)$/
  );
  // Driver id taken from profile path
  const selectedDriverId = driverProfileMatch
    ? driverProfileMatch[1]
    : null;

  // Literally the same thing for vehicles
  const vehicleProfileMatch = location.pathname.match(
    /^\/dashboard\/vehicles\/(\d+)$/
  );

  const selectedVehicleId = vehicleProfileMatch
    ? vehicleProfileMatch[1]
    : null;

  const managerProfileMatch = location.pathname.match(
    /^\/dashboard\/managers\/(\d+)$/,
  );
  const selectedManagerId = managerProfileMatch
    ? managerProfileMatch[1]
    : null;

  const alertMatch = location.pathname.match(/^\/dashboard\/alerts\/([^/]+)\/(\d+)$/);
  const selectedAlertType = alertMatch ? decodeURIComponent(alertMatch[1]) : null;
  const selectedAlertId = alertMatch ? alertMatch[2] : null;

  const [loading, setLoading] = useState(true);

  // Var for fetching Drivers data
  const [drivers, setDrivers] = useState([]);
  const [driversLoaded, setDriversLoaded] = useState(false); // checks if already loaded
  const [driversLoading, setDriversLoading] = useState(false); // can be used for loading screen later
  const [driversError, setDriversError] = useState("");

  const [trips, setTrips] = useState([]);
  const [tripsLoaded, setTripsLoaded] = useState(false);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripsError, setTripsError] = useState("");

  // Same thing for Vehicles data
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // Managers are loaded only when the owner opens the Managers tab.
  const [managers, setManagers] = useState([]);
  const [managersLoaded, setManagersLoaded] = useState(false);
  const [managersLoading, setManagersLoading] = useState(false);
  const [managersError, setManagersError] = useState("");

  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState("");

  // We will eventually fetch real data here
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeDrivers: 0,
    alerts: 0,
  });

  // Function to fetch drivers data
  const fetchDrivers = useCallback(async () => {
    const token = localStorage.getItem("token");

    try {
      setDriversLoading(true);
      setDriversError("");

      const response = await fetch("http://localhost:5000/api/drivers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Failed to fetch drivers");
      }

      const data = await response.json();

      console.log("DRIVERS API RESPONSE:", data);

      setDrivers(data);
      // Mark as successfully loaded
      setDriversLoaded(true);
    } catch (error) {
      console.error("Error loading drivers:", error);
      setDriversError(error.message || "Failed to fetch drivers");
    } finally {
      setDriversLoading(false);
    }
  }, [navigate]);

  // Function to fetch vehicle data
  const fetchVehicles = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setVehiclesLoading(true);

      const response = await fetch("http://localhost:5000/api/vehicles", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch vehicles");
      }

      const data = await response.json();

      console.log("VEHICLES API RESPONSE:", data);

      setVehicles(data);
      setVehiclesLoaded(true);
    } catch (error) {
      console.error("Error loading vehicles:", error);
    } finally {
      setVehiclesLoading(false);
    }
  }, [navigate]);

  const fetchManagers = useCallback(async () => {
    try {
      setManagersLoading(true);
      setManagersError("");
      const data = await apiFetch("/api/company/managers");
      setManagers(data);
      setManagersLoaded(true);
    } catch (error) {
      console.error("Error loading managers:", error);
      setManagersError(error.message || "Failed to fetch managers");
    } finally {
      setManagersLoading(false);
    }
  }, []);

  const fetchTrips = useCallback(async () => {
    try {
      setTripsLoading(true);
      setTripsError("");
      setTrips(await apiFetch("/api/company/trips"));
      setTripsLoaded(true);
    } catch (error) {
      setTripsError(error.message || "Failed to fetch trips");
    } finally {
      setTripsLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      setAlertsLoading(true);
      setAlertsError("");
      const data = await apiFetch("/api/company/alerts");
      setAlerts(data);
    } catch (error) {
      console.error("Error loading alerts:", error);
      setAlertsError(error.message || "Failed to load alerts");
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const resolveAlert = useCallback(async (alertType, alertId) => {
    try {
      await apiFetch(`/api/company/alerts/${encodeURIComponent(alertType)}/${alertId}/resolve`, {
        method: "POST",
      });
      await fetchAlerts();
    } catch (error) {
      setAlertsError(error.message || "Unable to resolve alert.");
    }
  }, [fetchAlerts]);

  const refreshTripResources = useCallback(() => {
    fetchTrips();
    fetchDrivers();
    fetchVehicles();
  }, [fetchDrivers, fetchTrips, fetchVehicles]);

  useEffect(() => {
    // 1. Grab the token from local storage
    const token = localStorage.getItem("token");

    // 2. If there is no token, bounce them to login
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchCompanyContext = async () => {
      try {
        const context = await apiFetch("/api/company/context");
        setCompanyContext(context);
      } catch (error) {
        console.error("Error loading company context:", error);
      }
    };

    fetchCompanyContext();

    const fetchProfileStatus = async () => {
      try {
        const accountData = await apiFetch('/api/auth/account');
        if (!accountData.full_name || !accountData.phone || !accountData.address) {
          setProfileIncomplete(true);
        }
      } catch (err) { }
    };
    fetchProfileStatus();

    // 3. Create an async function to fetch the secure data
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/dashboard/stats",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // Inject the JWT here
            },
          },
        );

        // 4. Handle expired or invalid tokens (401 Unauthorized)
        if (response.status === 401) {
          localStorage.clear();
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }

        // 5. Parse the JSON and update our React state
        const data = await response.json();
        setStats({
          totalVehicles: data.totalVehicles,
          activeDrivers: data.activeDrivers,
          alerts: data.alerts,
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // New useEffect for handling Drivers data for Drivers tab
  // Load drivers only when the Drivers tab is opened
  useEffect(() => {
    if (activeTab !== "drivers" && activeTab !== "trips") {
      return;
    }

    // Already fetched → don't fetch again
    if (driversLoaded) {
      return;
    }

    fetchDrivers();
  }, [activeTab, driversLoaded, fetchDrivers]);

  useEffect(() => {
    if (activeTab === "trips" && !tripsLoaded) fetchTrips();
  }, [activeTab, tripsLoaded, fetchTrips]);

  useEffect(() => {
    if (activeTab !== "alerts") {
      return;
    }
    fetchAlerts();
  }, [activeTab, fetchAlerts]);

  // useEffect for Vehicles data
  // Load vehicles only when the Vehicles tab is opened
  useEffect(() => {
    if (activeTab !== "vehicles" && activeTab !== "trips") {
      return;
    }

    if (vehiclesLoaded) {
      return;
    }

    fetchVehicles();
  }, [activeTab, vehiclesLoaded, fetchVehicles]);

  useEffect(() => {
    if (activeTab !== "managers" || userRole !== "owner" || managersLoaded) {
      return;
    }

    fetchManagers();
  }, [activeTab, managersLoaded, fetchManagers, userRole]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading || !companyContext)
    return <div style={{ padding: "20px" }}>Loading your dashboard...</div>;

  if (!companyContext.hasCompany) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppBar position="static" color="secondary">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Fleeter OS</Typography>
            <Typography variant="body2">Company: No company selected</Typography>
            <IconButton color="error" onClick={handleLogout} sx={{ ml: 2 }}>
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box maxWidth="900px" mx="auto" p={{ xs: 2, sm: 4 }}>
          <Typography variant="overline" color="primary.main" fontWeight={700}>
            Step 2 of 2 · Manager onboarding
          </Typography>
          <Typography variant="h4" gutterBottom sx={{ mt: 1, fontWeight: 800 }}>
            Join a company
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Your name is saved. Choose a company and send a request for manager access.
          </Typography>
          <CompanyRequests joinOnly />
        </Box>
      </Box>
    );
  }

  const navItems = [
    { label: "Overview", tab: "overview", icon: <DashboardIcon /> },
    { label: "Live Map", tab: "map", icon: <MapIcon /> },
    { label: "Vehicles", tab: "vehicles", icon: <DirectionsCarIcon /> },
    { label: "Drivers", tab: "drivers", icon: <PersonIcon /> },
    { label: "Trips", tab: "trips", icon: <RouteIcon /> },
    { label: "Alerts", tab: "alerts", icon: <WarningAmberIcon /> },
    ...(userRole === "owner" ? [{ label: "Managers", tab: "managers", icon: <GroupIcon /> }] : []),
    { label: "Recruit", tab: "recruit", icon: <WorkIcon /> },
    { label: "Settings", tab: "settings", icon: <SettingsIcon /> },
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        {/* Logo area */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <LocalShippingIcon color="primary" />
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="primary" letterSpacing={1} lineHeight={1.2}>
              FLEETER
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {companyContext.companyName || "Unnamed company"}
            </Typography>
          </Box>
        </Box>

        {/* Nav */}
        <List sx={{ pt: 1 }}>
          {navItems.map(({ label, tab, icon }) => (
            <ListItem key={tab} disablePadding>
              <ListItemButton
                selected={activeTab === tab}
                onClick={() => navigate(`/dashboard/${tab}`)}
              >
                <ListItemIcon sx={{ minWidth: 36, color: activeTab === tab ? "primary.main" : "inherit" }}>
                  {icon}
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: activeTab === tab ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* AppBar */}
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
              Command Center
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              {userRole}
            </Typography>
            <IconButton onClick={handleNotificationsClick}>
              <Badge badgeContent={(stats?.alerts || 0) + (profileIncomplete ? 1 : 0)} color="error">
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
                {profileIncomplete && (
                  <Button
                    fullWidth
                    color="inherit"
                    sx={{ justifyContent: "flex-start", textTransform: "none", textAlign: "left", color: "warning.main", mb: 1 }}
                    onClick={() => { handleNotificationsClose(); navigate("/dashboard/settings"); }}
                  >
                    ⚠️ Action Required: Please complete your profile information (Full Name, Phone, and Address).
                  </Button>
                )}
                {stats?.alerts > 0 && (
                  <Button
                    fullWidth
                    sx={{ justifyContent: "flex-start", textTransform: "none" }}
                    onClick={() => { handleNotificationsClose(); navigate("/dashboard/overview"); }}
                  >
                    ⚠️ You have {stats.alerts} system alert(s).
                  </Button>
                )}
                {(!stats?.alerts || stats.alerts === 0) && !profileIncomplete && (
                  <Typography variant="body2" color="text.secondary">No new notifications.</Typography>
                )}
              </Box>
            </Popover>
            <Tooltip title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton onClick={toggleTheme} sx={{ mx: 0.5 }}>
                {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton onClick={() => navigate("/dashboard/settings")} sx={{ mx: 0.5 }}>
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

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          {activeTab === "overview" && (
            <>
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <MetricCard title="Total Vehicles" value={stats.totalVehicles} color="#3498db" />
                <MetricCard title="Active Drivers" value={stats.activeDrivers} color="#2ecc71" />
                <MetricCard title="System Alerts" value={stats.alerts} color="#e67e22" />
              </Box>
              <Paper
                variant="outlined"
                sx={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Typography color="text.secondary">Overview Analytics Will Go Here</Typography>
              </Paper>
            </>
          )}

          {activeTab === "map" && <LiveMap />}

          {activeTab === "vehicles" && (
            selectedVehicleId ? (
              <VehicleDetails vehicleId={selectedVehicleId} onBack={() => navigate("/dashboard/vehicles")} />
            ) : (
              <VehiclesTable
                vehicles={vehicles}
                vehiclesLoading={vehiclesLoading}
                onRefresh={fetchVehicles}
                onVehicleClick={(id) => navigate(`/dashboard/vehicles/${id}`)}
                onDriverClick={(id) => navigate(`/dashboard/drivers/${id}`)}
              />
            )
          )}

          {activeTab === "drivers" && (
            selectedDriverId ? (
              <DriverDetails driverId={selectedDriverId} onBack={() => navigate("/dashboard/drivers")} />
            ) : (
              <DriversTable
                drivers={drivers}
                driversLoading={driversLoading}
                error={driversError}
                onRefresh={() => { fetchDrivers(); fetchVehicles(); }}
                onDriverClick={(id) => navigate(`/dashboard/drivers/${id}`)}
              />
            )
          )}

          {activeTab === "trips" && (
            <>
              {tripsError && <Typography color="error" mb={1}>{tripsError}</Typography>}
              <TripsTable
                trips={trips}
                tripsLoading={tripsLoading}
                drivers={drivers}
                vehicles={vehicles}
                onDriverClick={(id) => navigate(`/dashboard/drivers/${id}`)}
                onVehicleClick={(id) => navigate(`/dashboard/vehicles/${id}`)}
                onRefresh={refreshTripResources}
              />
            </>
          )}

          {activeTab === "managers" && userRole === "owner" && (
            selectedManagerId ? (
              <ManagerDetails managerId={selectedManagerId} onBack={() => navigate("/dashboard/managers")} />
            ) : (
              <ManagersTable
                managers={managers}
                managersLoading={managersLoading}
                error={managersError}
                onRefresh={fetchManagers}
                onManagerClick={(id) => navigate(`/dashboard/managers/${id}`)}
              />
            )
          )}

          {activeTab === "alerts" && (
            selectedAlertType && selectedAlertId ? (
              <AlertDetails
                alertType={selectedAlertType}
                alertId={selectedAlertId}
                onBack={() => navigate("/dashboard/alerts")}
              />
            ) : (
              <>
                {alertsError && <Typography color="error" sx={{ mb: 2 }}>{alertsError}</Typography>}
                <AlertsTable
                  alerts={alerts}
                  alertsLoading={alertsLoading}
                  onRefresh={fetchAlerts}
                  onAlertClick={(alertType, alertId) => navigate(`/dashboard/alerts/${encodeURIComponent(alertType)}/${alertId}`)}
                  onResolve={resolveAlert}
                />
              </>
            )
          )}

          {activeTab === "recruit" && (
            <CompanyRequests showJoinRequest={!companyContext.hasCompany} />
          )}

          {activeTab === "settings" && <AccountSettings />}
        </Box>
      </Box>
    </Box>
  );
}

function MetricCard({ title, value, color }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        p: 2.5,
        borderLeft: `5px solid ${color}`,
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: 3 },
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" display="block" mb={0.5}>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={700} color="text.primary">
        {value}
      </Typography>
    </Paper>
  );
}

export default OwnerDashboard;
