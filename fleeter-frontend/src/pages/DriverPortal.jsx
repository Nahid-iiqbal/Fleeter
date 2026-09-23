import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import LocateControl from "../components/LocateControl";
import { apiFetch } from "../utils/api";
import CompanyRequests from "../components/CompanyRequests";
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
  Button,
  Stack,
  Badge,
  Popover,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import WarningIcon from '@mui/icons-material/Warning';
import BuildIcon from '@mui/icons-material/Build';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountSettings from '../components/AccountSettings';
import { useThemeSettings } from '../context/ThemeSettingsContext';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Fix for Leaflet's default marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const DRAWER_WIDTH = 260;

function DriverDashboard() {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeSettings();
  const [loading, setLoading] = useState(true);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const handleNotificationsClick = (event) => setNotificationAnchorEl(event.currentTarget);
  const handleNotificationsClose = () => setNotificationAnchorEl(null);
  const isNotificationsOpen = Boolean(notificationAnchorEl);

  const [currentView, setCurrentView] = useState("dashboard");
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  const [driverStats, setDriverStats] = useState({
    name: "Loading...",
    companyName: "Loading...",
    trips: [],
    alerts: 0,
    driverProfileMissing: false,
    hasCompany: false,
  });

  // --- LIVE TRACKING STATE ---
  const [currentPosition, setCurrentPosition] = useState(null);

  // --- MODAL STATES ---
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState({
    liters: "",
    totalCost: "",
    stationName: "",
    odometer: "",
  });
  const [fuelError, setFuelError] = useState("");
  const [fuelSuccess, setFuelSuccess] = useState("");

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    type: "accident",
    severity: "minor",
    description: "",
    reportedTo: "",
  });
  const [incidentError, setIncidentError] = useState("");
  const [incidentSuccess, setIncidentSuccess] = useState("");
  const [incidentUploading, setIncidentUploading] = useState(false);

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    serviceType: "repair",
    description: "",
    odometer: "",
    workshop: "",
  });
  const [maintenanceError, setMaintenanceError] = useState("");
  const [maintenanceSuccess, setMaintenanceSuccess] = useState("");

  const [isStartTripModalOpen, setIsStartTripModalOpen] = useState(false);
  const [tripToStart, setTripToStart] = useState(null);
  const [startTripError, setStartTripError] = useState("");
  const [startTripSuccess, setStartTripSuccess] = useState("");

  const [isCompleteTripModalOpen, setIsCompleteTripModalOpen] = useState(false);
  const [completeTripError, setCompleteTripError] = useState("");
  const [completeTripSuccess, setCompleteTripSuccess] = useState("");

  // --- PROFILE/DOCUMENTS STATE ---
  const [driverDocs, setDriverDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  const [newDocForm, setNewDocForm] = useState({
    document_type: "driving_license",
    document_no: "",
    issue_date: "",
    expiry_date: "",
  });
  const [docError, setDocError] = useState("");
  const [docSuccess, setDocSuccess] = useState("");
  const [docUploading, setDocUploading] = useState(false);

  const fetchDriverData = useCallback(async () => {
    try {
      const data = await apiFetch("/api/driver/trips");
      const hasCompany = Boolean(data.companyName && data.companyName !== "Unassigned");

      setDriverStats({
        name: data.name || "Unknown",
        companyName: data.companyName || "Unassigned",
        trips: data.trips || [],
        alerts: 0,
        driverProfileMissing: data.driverProfileMissing,
        hasCompany,
      });

      try {
        const accountData = await apiFetch("/api/auth/account");
        setProfileIncomplete(
          !accountData.full_name || !accountData.phone || !accountData.address,
        );
      } catch (accountError) {
        console.error("Failed to load account profile:", accountError);
      }

      return hasCompany;
    } catch (error) {
      setDriverStats({
        name: "Network Error",
        trips: [],
        alerts: 0,
        driverProfileMissing: true,
        hasCompany: false,
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDriverData();
  }, [fetchDriverData]);

  useEffect(() => {
    if (loading || driverStats.hasCompany) return undefined;

    const approvalCheck = window.setInterval(async () => {
      if (await fetchDriverData()) window.location.reload();
    }, 5000);

    return () => window.clearInterval(approvalCheck);
  }, [driverStats.hasCompany, fetchDriverData, loading]);

  // --- FETCH DOCUMENTS ---
  const fetchDocuments = useCallback(async () => {
    setDocsLoading(true);
    try {
      const data = await apiFetch("/api/driver/documents");
      if (Array.isArray(data)) {
        setDriverDocs(data);
        const alertsCount = data.filter(
          (d) => d.alert_triggered || new Date(d.expiry_date) < new Date(),
        ).length;
        setDriverStats((prev) => ({ ...prev, alerts: alertsCount }));
      }
    } catch (error) {
      console.error("Failed to load documents", error);
      setDriverDocs([]);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const currentTrips = driverStats.trips.filter((t) => t.status === "in_progress");
  const futureTrips = driverStats.trips.filter((t) => t.status === "scheduled");
  const pastTrips = driverStats.trips.filter((t) => t.status === "completed");
  const activeTrip = currentTrips.length > 0 ? currentTrips[0] : null;
  const canAccessTripFeatures = activeTrip !== null;

  const calculateDuration = (start, end) => {
    if (!start || !end) return "N/A";
    const diffMs = new Date(end) - new Date(start);
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  const confirmStartTrip = async () => {
    if (!tripToStart) return;
    setStartTripError("");
    setStartTripSuccess("");
    try {
      const responseData = await apiFetch(`/api/driver/trips/${tripToStart.trip_id}/start`, { method: "PUT" });
      setStartTripSuccess("Trip started successfully!");
      setTimeout(() => {
        setIsStartTripModalOpen(false);
        setStartTripSuccess("");
        setDriverStats((prev) => ({
          ...prev,
          trips: prev.trips.map((t) =>
            t.trip_id === tripToStart.trip_id ? { ...t, status: "in_progress", departure_time: responseData.trip.departure_time } : t
          ),
        }));
        setTripToStart(null);
      }, 1500);
    } catch (error) {
      setStartTripError(error.message);
    }
  };

  const confirmCompleteTrip = async () => {
    setCompleteTripError("");
    setCompleteTripSuccess("");
    try {
      const responseData = await apiFetch(`/api/driver/trips/${activeTrip.trip_id}/complete`, { method: "PUT" });
      setCompleteTripSuccess("Trip completed successfully!");
      setTimeout(() => {
        setIsCompleteTripModalOpen(false);
        setCompleteTripSuccess("");
        setDriverStats((prev) => ({
          ...prev,
          trips: prev.trips.map((t) =>
            t.trip_id === activeTrip.trip_id ? { ...t, status: "completed", arrival_time: responseData.trip.arrival_time } : t
          ),
        }));
        setCurrentPosition(null);
      }, 1500);
    } catch (error) {
      setCompleteTripError(error.message);
    }
  };

  useEffect(() => {
    let watchId;
    if (activeTrip && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, altitude, speed } = position.coords;
          setCurrentPosition([latitude, longitude]);
          let batteryLevel = null;
          if ("getBattery" in navigator) {
            const battery = await navigator.getBattery();
            batteryLevel = Math.round(battery.level * 100);
          }
          try {
            await apiFetch("/api/tracking/ping", {
              method: "POST",
              body: JSON.stringify({
                vehicle_id: activeTrip.vehicle_id,
                trip_id: activeTrip.trip_id,
                latitude,
                longitude,
                speed_kmh: speed ? (speed * 3.6).toFixed(2) : 0.0,
                altitude: altitude ? altitude.toFixed(2) : null,
                battery_level: batteryLevel,
              }),
            });
          } catch (error) { }
        },
        (error) => console.error("Error capturing GPS:", error),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 },
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [activeTrip]);

  const deleteDocument = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await apiFetch(`/api/driver/documents/${documentId}`, { method: "DELETE" });
      setDriverDocs(driverDocs.filter((doc) => doc.document_id !== documentId));
    } catch (error) {
      alert(`Failed to delete: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout notification failed", err);
    } finally {
      localStorage.clear();
      navigate("/login");
    }
  };

  const handleDocChange = (e) => setNewDocForm({ ...newDocForm, [e.target.name]: e.target.value });

  const submitDocument = async (e) => {
    e.preventDefault();
    setDocError("");
    setDocSuccess("");
    setDocUploading(true);

    const formElement = e.target;
    const formData = new FormData(formElement);

    try {
      const response = await fetch("http://localhost:5000/api/driver/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setDocSuccess("Document added successfully!");
        setNewDocForm({ document_type: "driving_license", document_no: "", issue_date: "", expiry_date: "" });
        formElement.reset();
        setDriverStats((prev) => ({ ...prev, driverProfileMissing: false }));

        if (data.document) {
          setDriverDocs((prev) => [...prev, data.document]);
          setShowDocuments(true);
        }
        setTimeout(() => setDocSuccess(""), 3000);
      } else {
        setDocError(data.error || data.message || "Failed to upload document.");
      }
    } catch (error) {
      setDocError("Network error: " + error.message);
    } finally {
      setDocUploading(false);
    }
  };

  const handleFuelChange = (e) => setFuelForm({ ...fuelForm, [e.target.name]: e.target.value });

  const submitFuelLog = async (e) => {
    e.preventDefault();
    setFuelError("");
    setFuelSuccess("");
    try {
      const liters = parseFloat(fuelForm.liters);
      const totalCost = parseFloat(fuelForm.totalCost);
      const costPerLiter = (totalCost / liters).toFixed(2);

      await apiFetch("/api/driver/log-fuel", {
        method: "POST",
        body: JSON.stringify({
          vehicle_id: activeTrip?.vehicle_id,
          trip_id: activeTrip?.trip_id,
          liters,
          total_cost: totalCost,
          cost_per_liter: costPerLiter,
          odometer_km: parseInt(fuelForm.odometer),
          station_name: fuelForm.stationName,
        }),
      });

      setFuelSuccess("Fuel logged successfully!");
      setTimeout(() => {
        setIsFuelModalOpen(false);
        setFuelSuccess("");
        setFuelForm({ liters: "", totalCost: "", stationName: "", odometer: "" });
      }, 1500);
    } catch (error) {
      setFuelError(error.message);
    }
  };

  const handleIncidentChange = (e) => setIncidentForm({ ...incidentForm, [e.target.name]: e.target.value });

  const submitIncidentLog = async (e) => {
    e.preventDefault();
    setIncidentError("");
    setIncidentSuccess("");
    setIncidentUploading(true);

    const formElement = e.target;
    const formData = new FormData(formElement);
    formData.append("trip_id", activeTrip?.trip_id);

    try {
      const response = await fetch("/api/driver/log-incident", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setIncidentSuccess("Incident reported successfully.");
        setTimeout(() => {
          setIsIncidentModalOpen(false);
          setIncidentSuccess("");
          setIncidentForm({ type: "accident", severity: "minor", description: "", reportedTo: "" });
          formElement.reset();
        }, 1500);
      } else {
        setIncidentError(data.error || "Failed to log incident.");
      }
    } catch (error) {
      setIncidentError("Network error: " + error.message);
    } finally {
      setIncidentUploading(false);
    }
  };

  const handleMaintenanceChange = (e) => setMaintenanceForm({ ...maintenanceForm, [e.target.name]: e.target.value });

  const submitMaintenanceRequest = async (e) => {
    e.preventDefault();
    setMaintenanceError("");
    setMaintenanceSuccess("");
    try {
      await apiFetch("/api/driver/request-maintenance", {
        method: "POST",
        body: JSON.stringify({
          vehicle_id: activeTrip?.vehicle_id,
          service_type: maintenanceForm.serviceType,
          description: maintenanceForm.description,
          odometer_km: parseInt(maintenanceForm.odometer),
          workshop: maintenanceForm.workshop,
        }),
      });

      setMaintenanceSuccess("Maintenance requested successfully.");
      setTimeout(() => {
        setIsMaintenanceModalOpen(false);
        setMaintenanceSuccess("");
        setMaintenanceForm({ serviceType: "repair", description: "", odometer: "", workshop: "" });
      }, 1500);
    } catch (error) {
      setMaintenanceError(error.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading your dashboard...</Typography>
      </Box>
    );
  }

  if (!driverStats.hasCompany) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppBar position="static" color="secondary">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Fleeter OS</Typography>
            <Typography variant="body2">Welcome, {driverStats.name}</Typography>
            <IconButton color="error" onClick={handleLogout} sx={{ ml: 2 }}>
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box maxWidth="900px" mx="auto" p={{ xs: 2, sm: 4 }}>
          {docsLoading ? (
            <Typography color="text.secondary">Preparing your account setup...</Typography>
          ) : !driverDocs.some((doc) => doc.document_type === "driving_license" && doc.document_no && doc.issue_date && doc.expiry_date && doc.document_url) ? (
            <Box sx={{ maxWidth: 680, mx: "auto" }}>
              <Typography variant="overline" color="primary.main" fontWeight={700}>
                Step 2 of 3 · Driver verification
              </Typography>
              <Typography variant="h3" sx={{ mt: 1, mb: 1, fontWeight: 800 }}>
                Add your driver&apos;s licence
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Upload your driver&apos;s licence before requesting access to a company. You can add or update other documents from the Documents tab later.
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                {["Name entered", "Driver's licence", "Company request"].map((step, index) => (
                  <Box key={step} sx={{ flex: 1, borderTop: "4px solid", borderColor: index === 0 ? "primary.main" : "divider", pt: 1 }}>
                    <Typography variant="caption" fontWeight={700} color={index === 1 ? "primary.main" : "text.secondary"}>
                      {step}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "background.paper", boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)" }}>
                {docError && <Alert severity="error" sx={{ mb: 2 }}>{docError}</Alert>}
                <form onSubmit={submitDocument}>
                  <Stack spacing={3}>
                    <input type="hidden" name="document_type" value="driving_license" />
                    <Box p={2} bgcolor="background.default" borderRadius={2} border="1px solid" borderColor="divider">
                      <Typography variant="caption" color="text.secondary" display="block">Required document</Typography>
                      <Typography variant="body1" fontWeight={700}>Driver&apos;s licence</Typography>
                    </Box>
                    <TextField
                      variant="outlined"
                      label="Document number"
                      name="document_no"
                      value={newDocForm.document_no}
                      onChange={handleDocChange}
                      required
                      fullWidth
                    />
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2 }}>
                      <TextField
                        variant="outlined"
                        type="date"
                        label="Issue date"
                        name="issue_date"
                        value={newDocForm.issue_date}
                        onChange={handleDocChange}
                        required
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        variant="outlined"
                        type="date"
                        label="Expiry date"
                        name="expiry_date"
                        value={newDocForm.expiry_date}
                        inputProps={{ min: newDocForm.issue_date }}
                        onChange={handleDocChange}
                        required
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                    <TextField
                      variant="outlined"
                      label="Licence scan or image"
                      type="file"
                      name="documentFile"
                      inputProps={{ accept: "image/*,.pdf" }}
                      required
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      helperText="Upload an image or PDF of your driver's licence."
                    />
                    <Button type="submit" variant="contained" color="primary" size="large" disableElevation>
                      Save document and continue
                    </Button>
                  </Stack>
                </form>
              </Box>
            </Box>
          ) : <CompanyRequests joinOnly />}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: "divider", display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle1" fontWeight={800} color="primary" letterSpacing={1} lineHeight={1.2}>
            FLEETER
          </Typography>
          <Typography variant="caption" color="text.secondary" mt={0.5}>
            Welcome, {driverStats.name}
          </Typography>
          {!driverStats.driverProfileMissing && (
            <Typography variant="caption" color="text.primary" fontWeight={600} mt={0.5}>
              🏢 {driverStats.companyName}
            </Typography>
          )}
        </Box>
        <List sx={{ flexGrow: 1, pt: 1 }}>
          <ListItem disablePadding>
            <ListItemButton selected={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')}>
              <DashboardIcon sx={{ mr: 2, color: currentView === 'dashboard' ? 'primary.main' : 'text.secondary' }} />
              <ListItemText primary="Dashboard" primaryTypographyProps={{ fontWeight: currentView === 'dashboard' ? 700 : 500 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={currentView === 'history'} onClick={() => setCurrentView('history')}>
              <HistoryIcon sx={{ mr: 2, color: currentView === 'history' ? 'primary.main' : 'text.secondary' }} />
              <ListItemText primary="Trip History" primaryTypographyProps={{ fontWeight: currentView === 'history' ? 700 : 500 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={currentView === 'documents'} onClick={() => setCurrentView('documents')}>
              <DescriptionIcon sx={{ mr: 2, color: currentView === 'documents' ? 'primary.main' : 'text.secondary' }} />
              <ListItemText primary="Documents" primaryTypographyProps={{ fontWeight: currentView === 'documents' ? 700 : 500 }} />
            </ListItemButton>
          </ListItem>
        </List>
        <Box p={2}>
          <Typography variant="overline" color="text.secondary" display="block" mb={1}>Trip Actions</Typography>
          <Button fullWidth variant="outlined" color="info" sx={{ mb: 1.5, justifyContent: "flex-start" }} startIcon={<LocalGasStationIcon />} disabled={!canAccessTripFeatures} onClick={() => setIsFuelModalOpen(true)}>Log Fuel</Button>
          <Button fullWidth variant="outlined" color="error" sx={{ mb: 1.5, justifyContent: "flex-start" }} startIcon={<WarningIcon />} disabled={!canAccessTripFeatures} onClick={() => setIsIncidentModalOpen(true)}>Report Incident</Button>
          <Button fullWidth variant="outlined" color="warning" sx={{ mb: 1.5, justifyContent: "flex-start" }} startIcon={<BuildIcon />} disabled={!canAccessTripFeatures} onClick={() => setIsMaintenanceModalOpen(true)}>Maintenance</Button>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: "hidden" }}>
        <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>Driver Portal</Typography>
            <IconButton color="inherit" onClick={handleNotificationsClick}>
              <Badge badgeContent={(driverStats?.alerts || 0) + (driverStats?.driverProfileMissing ? 1 : 0) + (profileIncomplete ? 1 : 0)} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Popover
              open={isNotificationsOpen}
              anchorEl={notificationAnchorEl}
              onClose={handleNotificationsClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Box p={2} minWidth={280}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Notifications</Typography>
                {driverStats?.driverProfileMissing && (
                  <Button fullWidth color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', textAlign: 'left', color: 'error.main', mb: 1 }} onClick={() => { handleNotificationsClose(); }}>
                    ⚠️ Action Required: Your account is not linked to a Driver profile in the database. Contact your fleet admin.
                  </Button>
                )}
                {profileIncomplete && (
                  <Button fullWidth color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', textAlign: 'left', color: 'warning.main', mb: 1 }} onClick={() => { handleNotificationsClose(); setCurrentView('settings'); }}>
                    ⚠️ Action Required: Please complete your profile information (Full Name, Phone, and Address).
                  </Button>
                )}
                {driverStats?.alerts > 0 && (
                  <Button fullWidth color="inherit" sx={{ justifyContent: 'flex-start', textTransform: 'none', textAlign: 'left', color: 'warning.main', mb: 1 }} onClick={() => { handleNotificationsClose(); setCurrentView('documents'); }}>
                    ⚠️ You have {driverStats.alerts} document alert(s) pending. Click to view.
                  </Button>
                )}
                {(!driverStats?.alerts || driverStats.alerts === 0) && !driverStats?.driverProfileMissing && !profileIncomplete && (
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
              <IconButton onClick={() => setCurrentView('settings')}>
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

        <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1 }}>

          {currentView === 'settings' && <AccountSettings />}

          {/* --- DASHBOARD VIEW --- */}
          {currentView === "dashboard" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Box>
                <Typography variant="h6" fontWeight={700} mb={2} sx={{ borderBottom: 2, borderColor: "divider", pb: 1 }}>
                  Current Trip
                </Typography>
                {activeTrip ? (
                  <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderLeft: 6, borderLeftColor: "success.main" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
                        <Box>
                          <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
                            Route: {activeTrip.origin} ➔ {activeTrip.destination}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            <strong>Vehicle:</strong> {activeTrip.registration_no}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            <strong>Started:</strong> {new Date(activeTrip.departure_time).toLocaleString()}
                          </Typography>
                        </Box>
                        <Chip label="IN PROGRESS" color="success" sx={{ fontWeight: 700 }} />
                      </Box>
                      <Box sx={{ mt: 3 }}>
                        <Button variant="contained" color="success" size="large" onClick={() => setIsCompleteTripModalOpen(true)}>
                          Complete Trip
                        </Button>
                      </Box>

                      <Box sx={{ mt: 4 }}>
                        <Typography variant="subtitle1" fontWeight={700} mb={2}>
                          Live GPS Tracking
                        </Typography>
                        {currentPosition ? (
                          <Paper elevation={0} sx={{ height: 350, width: "100%", borderRadius: 2, overflow: "hidden", border: 1, borderColor: "divider" }}>
                            <MapContainer center={currentPosition} zoom={16} style={{ height: "100%", width: "100%" }}>
                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                              <LocateControl position={currentPosition} />
                              <Marker position={currentPosition}>
                                <Popup>You are actively tracking.</Popup>
                              </Marker>
                            </MapContainer>
                          </Paper>
                        ) : (
                          <Alert severity="warning">
                            📡 Acquiring GPS signal... Please ensure location permissions are enabled.
                          </Alert>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ) : (
                  <Paper elevation={0} sx={{ p: 4, textAlign: "center", bgcolor: "error.light", color: "error.dark", border: 2, borderColor: "error.main", borderStyle: "dashed" }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>No Active Trip</Typography>
                    <Typography>You are not currently on the road. Start a scheduled assignment below to unlock your trip tools.</Typography>
                  </Paper>
                )}
              </Box>

              <Box>
                <Typography variant="h6" fontWeight={700} mb={2} sx={{ borderBottom: 2, borderColor: "divider", pb: 1 }}>
                  Upcoming Assignments
                </Typography>
                {futureTrips.length > 0 ? (
                  <Grid container spacing={2}>
                    {futureTrips.map((trip) => (
                      <Grid item xs={12} key={trip.trip_id}>
                        <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderLeft: 4, borderLeftColor: "info.main" }}>
                          <CardContent sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box>
                              <Typography variant="h6" fontWeight={700} color="text.primary">
                                {trip.origin} ➔ {trip.destination}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Vehicle: {trip.registration_no} | Scheduled: {new Date(trip.departure_time).toLocaleString()}
                              </Typography>
                            </Box>
                            <Button
                              variant="contained"
                              color="info"
                              onClick={() => {
                                setTripToStart(trip);
                                setIsStartTripModalOpen(true);
                              }}
                            >
                              Start
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary" fontStyle="italic">No upcoming scheduled trips.</Typography>
                )}
              </Box>
            </Box>
          )}

          {/* --- HISTORY VIEW --- */}
          {currentView === "history" && (
            <Box>
              <Typography variant="h6" fontWeight={700} mb={3} sx={{ borderBottom: 2, borderColor: "divider", pb: 1 }}>
                Trip History
              </Typography>
              {pastTrips.length > 0 ? (
                <Grid container spacing={2}>
                  {pastTrips.map((trip) => (
                    <Grid item xs={12} md={6} key={trip.trip_id}>
                      <Card elevation={0} sx={{ border: 1, borderColor: "divider", borderLeft: 4, borderLeftColor: "text.disabled" }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" fontWeight={700} color="text.primary">
                            {trip.origin} ➔ {trip.destination}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            Vehicle: {trip.registration_no}
                          </Typography>
                          <Paper elevation={0} sx={{ p: 2, bgcolor: "action.hover", display: "flex", justifyContent: "space-between", borderRadius: 2 }}>
                            <Box>
                              <Typography variant="caption" fontWeight={700} display="block">Started:</Typography>
                              <Typography variant="body2">{new Date(trip.departure_time).toLocaleString()}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" fontWeight={700} display="block">Ended:</Typography>
                              <Typography variant="body2">{new Date(trip.arrival_time).toLocaleString()}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" fontWeight={700} color="primary" display="block">Total Time:</Typography>
                              <Typography variant="body2" color="primary">{calculateDuration(trip.departure_time, trip.arrival_time)}</Typography>
                            </Box>
                          </Paper>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="text.secondary" fontStyle="italic">No completed trips found.</Typography>
              )}
            </Box>
          )}

          {/* --- PROFILE / DOCUMENTS VIEW --- */}
          {currentView === "documents" && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={7}>
                <Card elevation={0} sx={{ border: 1, borderColor: "divider", mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: showDocuments ? 3 : 0 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>My Documents</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {driverDocs.length} document{driverDocs.length !== 1 ? 's' : ''} on file.
                        </Typography>
                      </Box>
                      <Button variant="outlined" onClick={() => setShowDocuments(!showDocuments)}>
                        {showDocuments ? "Hide Documents" : "View Documents"}
                      </Button>
                    </Box>

                    {showDocuments && (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}>
                        {docsLoading ? (
                          <Typography color="text.secondary">Loading documents...</Typography>
                        ) : driverDocs.length === 0 ? (
                          <Typography color="text.secondary" fontStyle="italic">No documents uploaded yet.</Typography>
                        ) : (
                          driverDocs.map((doc) => {
                            const isExpired = new Date(doc.expiry_date) < new Date();
                            const hasAlert = doc.alert_triggered || isExpired;
                            const borderColor = hasAlert ? "error.main" : "success.main";

                            return (
                              <Paper key={doc.document_id} elevation={0} sx={{ p: 2, border: 1, borderColor: "divider", borderLeft: 6, borderLeftColor: borderColor, borderRadius: 2, display: "flex", gap: 3, alignItems: "flex-start" }}>
                                {/* Document Image Thumbnail */}
                                <Box sx={{ width: 100, height: 100, flexShrink: 0, borderRadius: 1, overflow: "hidden", bgcolor: "action.hover", border: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {doc.document_url ? (
                                    doc.document_url.toLowerCase().endsWith('.pdf') ? (
                                      <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                                        <DescriptionIcon sx={{ fontSize: 32, mb: 1 }} />
                                        <Typography variant="caption" display="block">PDF</Typography>
                                      </Box>
                                    ) : (
                                      <Box component="img" src={`http://localhost:5000${doc.document_url}`} alt={doc.document_type} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    )
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">No Image</Typography>
                                  )}
                                </Box>

                                {/* Document Details */}
                                <Box sx={{ flex: 1 }}>
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                                      {doc.document_type.replace("_", " ")}
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                      {isExpired && (
                                        <Chip label="EXPIRED" color="error" size="small" sx={{ fontWeight: 700 }} />
                                      )}
                                      <IconButton onClick={() => deleteDocument(doc.document_id)} color="error" size="small">
                                        <Typography fontSize={18}>🗑️</Typography>
                                      </IconButton>
                                    </Box>
                                  </Box>
                                  <Typography variant="body2" color="text.secondary" mb={1}>
                                    Number: {doc.document_no}
                                  </Typography>
                                  <Box sx={{ display: "flex", gap: 3 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      Issued: {new Date(doc.issue_date).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="body2" color={hasAlert ? "error.main" : "success.main"} fontWeight={700}>
                                      Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                                    </Typography>
                                  </Box>

                                  {doc.document_url && (
                                    <Button
                                      href={`http://localhost:5000${doc.document_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      startIcon={<OpenInNewIcon />}
                                      size="small"
                                      sx={{ mt: 1.5 }}
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
              </Grid>

              <Grid item xs={12} md={5}>
                {/* Document Upload Form */}
                <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="secondary.main" mb={3}>
                      + Add New Document
                    </Typography>

                    {docError && <Alert severity="error" sx={{ mb: 2 }}>{docError}</Alert>}
                    {docSuccess && <Alert severity="success" sx={{ mb: 2 }}>{docSuccess}</Alert>}

                    <form onSubmit={submitDocument}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            select
                            label="Document Type"
                            name="document_type"
                            value={newDocForm.document_type}
                            onChange={handleDocChange}
                            fullWidth
                            size="small"
                          >
                            <MenuItem value="driving_license">Driver's License</MenuItem>
                            <MenuItem value="medical">Medical Card</MenuItem>
                            <MenuItem value="insurance">Insurance Policy</MenuItem>
                            <MenuItem value="certification">Special Certification</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Document Number"
                            name="document_no"
                            value={newDocForm.document_no}
                            onChange={handleDocChange}
                            required
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Issue Date"
                            type="date"
                            name="issue_date"
                            value={newDocForm.issue_date}
                            onChange={handleDocChange}
                            required
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Expiry Date"
                            type="date"
                            name="expiry_date"
                            value={newDocForm.expiry_date}
                            inputProps={{ min: newDocForm.issue_date }}
                            onChange={handleDocChange}
                            required
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Upload Scan/Image"
                            type="file"
                            name="documentFile"
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
                            color="secondary"
                            disabled={docUploading}
                            fullWidth
                          >
                            {docUploading ? "Uploading..." : "Upload Document"}
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* ================= MODALS ================= */}

        {/* START TRIP MODAL */}
        <Dialog open={isStartTripModalOpen && !!tripToStart} onClose={() => setIsStartTripModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: 'info.main', fontWeight: 700 }}>Start Trip</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary" mb={2}>
              Are you ready to begin your trip to <strong>{tripToStart?.destination}</strong>? This will activate live GPS tracking.
            </Typography>
            {startTripError && <Alert severity="error" sx={{ mb: 2 }}>{startTripError}</Alert>}
            {startTripSuccess && <Alert severity="success" sx={{ mb: 2 }}>{startTripSuccess}</Alert>}
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setIsStartTripModalOpen(false)} color="inherit">Cancel</Button>
            <Button onClick={confirmStartTrip} variant="contained" color="info">Yes, Start Trip</Button>
          </DialogActions>
        </Dialog>

        {/* COMPLETE TRIP MODAL */}
        <Dialog open={isCompleteTripModalOpen} onClose={() => setIsCompleteTripModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: 'success.main', fontWeight: 700 }}>Complete Trip</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary" mb={2}>
              Are you sure you have arrived and want to complete this trip? This will stop live tracking.
            </Typography>
            {completeTripError && <Alert severity="error" sx={{ mb: 2 }}>{completeTripError}</Alert>}
            {completeTripSuccess && <Alert severity="success" sx={{ mb: 2 }}>{completeTripSuccess}</Alert>}
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setIsCompleteTripModalOpen(false)} color="inherit">Cancel</Button>
            <Button onClick={confirmCompleteTrip} variant="contained" color="success">Yes, Complete</Button>
          </DialogActions>
        </Dialog>

        {/* FUEL MODAL */}
        <Dialog open={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Log Fuel Purchase</DialogTitle>
          <form onSubmit={submitFuelLog}>
            <DialogContent dividers>
              {fuelError && <Alert severity="error" sx={{ mb: 2 }}>{fuelError}</Alert>}
              {fuelSuccess && <Alert severity="success" sx={{ mb: 2 }}>{fuelSuccess}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField label="Station Name" name="stationName" value={fuelForm.stationName} onChange={handleFuelChange} required fullWidth />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Liters Filled" type="number" inputProps={{ step: "0.01" }} name="liters" value={fuelForm.liters} onChange={handleFuelChange} required fullWidth />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Total Cost (৳)" type="number" inputProps={{ step: "0.01" }} name="totalCost" value={fuelForm.totalCost} onChange={handleFuelChange} required fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Current Odometer (km)" type="number" name="odometer" value={fuelForm.odometer} onChange={handleFuelChange} required fullWidth />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setIsFuelModalOpen(false)} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained" color="primary">Submit Log</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* INCIDENT MODAL */}
        <Dialog open={isIncidentModalOpen} onClose={() => setIsIncidentModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: 'error.main', fontWeight: 700 }}>Report Incident</DialogTitle>
          <form onSubmit={submitIncidentLog}>
            <DialogContent dividers>
              {incidentError && <Alert severity="error" sx={{ mb: 2 }}>{incidentError}</Alert>}
              {incidentSuccess && <Alert severity="success" sx={{ mb: 2 }}>{incidentSuccess}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField select label="Incident Type" name="type" value={incidentForm.type} onChange={handleIncidentChange} fullWidth>
                    <MenuItem value="accident">Accident</MenuItem>
                    <MenuItem value="breakdown">Breakdown</MenuItem>
                    <MenuItem value="traffic_violation">Traffic Violation</MenuItem>
                    <MenuItem value="theft">Theft</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField select label="Severity" name="severity" value={incidentForm.severity} onChange={handleIncidentChange} fullWidth>
                    <MenuItem value="minor">Minor</MenuItem>
                    <MenuItem value="moderate">Moderate</MenuItem>
                    <MenuItem value="severe">Severe</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Description of Incident" name="description" value={incidentForm.description} onChange={handleIncidentChange} required fullWidth multiline rows={3} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Reported To (Authority/Police)" name="reportedTo" value={incidentForm.reportedTo} onChange={handleIncidentChange} fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Attach Photo (Optional)" type="file" name="incidentImage" inputProps={{ accept: "image/*" }} fullWidth InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setIsIncidentModalOpen(false)} disabled={incidentUploading} color="inherit">Cancel</Button>
              <Button type="submit" disabled={incidentUploading} variant="contained" color="error">
                {incidentUploading ? "Uploading..." : "Submit Report"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* MAINTENANCE MODAL */}
        <Dialog open={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: 'warning.main', fontWeight: 700 }}>Request Maintenance</DialogTitle>
          <form onSubmit={submitMaintenanceRequest}>
            <DialogContent dividers>
              {maintenanceError && <Alert severity="error" sx={{ mb: 2 }}>{maintenanceError}</Alert>}
              {maintenanceSuccess && <Alert severity="success" sx={{ mb: 2 }}>{maintenanceSuccess}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField select label="Service Type" name="serviceType" value={maintenanceForm.serviceType} onChange={handleMaintenanceChange} fullWidth>
                    <MenuItem value="repair">Repair</MenuItem>
                    <MenuItem value="routine">Routine Service</MenuItem>
                    <MenuItem value="inspection">Inspection</MenuItem>
                    <MenuItem value="emergency">Emergency Breakdown</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Current Odometer" type="number" name="odometer" value={maintenanceForm.odometer} onChange={handleMaintenanceChange} required fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Issue Description" name="description" value={maintenanceForm.description} onChange={handleMaintenanceChange} required fullWidth multiline rows={3} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Preferred Workshop (Optional)" name="workshop" value={maintenanceForm.workshop} onChange={handleMaintenanceChange} fullWidth />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setIsMaintenanceModalOpen(false)} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained" color="warning">Submit Request</Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Box>
  );
}

export default DriverDashboard;
