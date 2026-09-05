import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import LocateControl from "../components/LocateControl";
import { apiFetch } from "../utils/api"; // 1. Import the utility
import CompanyRequests from "../components/CompanyRequests";

// Fix for Leaflet's default marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function DriverDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard");

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

  // --- ACCOUNT SETTINGS STATE ---
  const [accountForm, setAccountForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [accountError, setAccountError] = useState("");
  const [accountSuccess, setAccountSuccess] = useState("");

  // --- MODAL STATES (Separated Error & Success) ---
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
  const [incidentPhoto, setIncidentPhoto] = useState(null);
  const [incidentError, setIncidentError] = useState("");
  const [incidentSuccess, setIncidentSuccess] = useState("");

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
  const [newDocForm, setNewDocForm] = useState({
    document_type: "license",
    document_no: "",
    issue_date: "",
    expiry_date: "",
  });
  const [docError, setDocError] = useState("");
  const [docSuccess, setDocSuccess] = useState("");

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const data = await apiFetch("/api/driver/trips");

        setDriverStats({
          name: data.name || "Unknown",
          companyName: data.companyName || "Unassigned",
          trips: data.trips || [],
          alerts: 0,
          driverProfileMissing: data.driverProfileMissing,
          hasCompany: Boolean(data.companyName && data.companyName !== "Unassigned"),
        });

        setAccountForm({
          username: data.username || "",
          email: data.email || "",
          password: "",
        });
      } catch (error) {
        setDriverStats({
          name: "Network Error",
          trips: [],
          alerts: 0,
          driverProfileMissing: true,
          hasCompany: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDriverData();
  }, []);

  // --- FETCH DOCUMENTS ---
  useEffect(() => {
    const fetchDocuments = async () => {
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
    };

    if (currentView === "profile") fetchDocuments();
  }, [currentView]);

  // --- TRIP LOGIC HELPERS ---
  const currentTrips = driverStats.trips.filter(
    (t) => t.status === "in_progress",
  );
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

  // --- START TRIP HANDLER ---
  const confirmStartTrip = async () => {
    if (!tripToStart) return;
    setStartTripError("");
    setStartTripSuccess("");

    try {
      const responseData = await apiFetch(
        `/api/driver/trips/${tripToStart.trip_id}/start`,
        { method: "PUT" },
      );
      setStartTripSuccess("Trip started successfully!");

      setTimeout(() => {
        setIsStartTripModalOpen(false);
        setStartTripSuccess("");
        setDriverStats((prev) => ({
          ...prev,
          trips: prev.trips.map((t) =>
            t.trip_id === tripToStart.trip_id
              ? {
                ...t,
                status: "in_progress",
                departure_time: responseData.trip.departure_time,
              }
              : t,
          ),
        }));
        setTripToStart(null);
      }, 1500);
    } catch (error) {
      setStartTripError(error.message); // Displays 403 or 400 errors explicitly
    }
  };

  // --- COMPLETE TRIP HANDLER ---
  const confirmCompleteTrip = async () => {
    setCompleteTripError("");
    setCompleteTripSuccess("");
    try {
      const responseData = await apiFetch(
        `/api/driver/trips/${activeTrip.trip_id}/complete`,
        { method: "PUT" },
      );
      setCompleteTripSuccess("Trip completed successfully!");

      setTimeout(() => {
        setIsCompleteTripModalOpen(false);
        setCompleteTripSuccess("");
        setDriverStats((prev) => ({
          ...prev,
          trips: prev.trips.map((t) =>
            t.trip_id === activeTrip.trip_id
              ? {
                ...t,
                status: "completed",
                arrival_time: responseData.trip.arrival_time,
              }
              : t,
          ),
        }));
        setCurrentPosition(null);
      }, 1500);
    } catch (error) {
      setCompleteTripError(error.message);
    }
  };

  // --- LIVE TRACKING ENGINE ---
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
          } catch (error) {
            // Silently fail pings so we don't spam the user with errors while driving
          }
        },
        (error) => console.error("Error capturing GPS:", error),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 },
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [activeTrip]);

  // --- DELETE DOCUMENT ---
  const deleteDocument = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;
    try {
      await apiFetch(`/api/driver/documents/${documentId}`, {
        method: "DELETE",
      });
      setDriverDocs(driverDocs.filter((doc) => doc.document_id !== documentId));
    } catch (error) {
      alert(`Failed to delete: ${error.message}`);
    }
  };

  // --- LOGOUT HANDLER ---
  const handleLogout = async () => {
    try {
      // Genuinely invalidate token on the server
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout notification failed", err);
    } finally {
      localStorage.clear();
      navigate("/login");
    }
  };

  // --- ACCOUNT HANDLER ---
  const handleAccountChange = (e) =>
    setAccountForm({ ...accountForm, [e.target.name]: e.target.value });

  const updateAccount = async (e) => {
    e.preventDefault();
    setAccountError("");
    setAccountSuccess("");
    try {
      await apiFetch("/api/driver/account", {
        method: "PUT",
        body: JSON.stringify(accountForm),
      });
      setAccountSuccess("Account updated successfully!");
      setTimeout(() => setAccountSuccess(""), 3000);
    } catch (error) {
      setAccountError(error.message);
    }
  };

  // --- DOCS HANDLER ---
  const handleDocChange = (e) =>
    setNewDocForm({ ...newDocForm, [e.target.name]: e.target.value });

  const submitDocument = async (e) => {
    e.preventDefault();
    setDocError("");
    setDocSuccess("");
    try {
      await apiFetch("/api/driver/documents", {
        method: "POST",
        body: JSON.stringify(newDocForm),
      });

      setDocSuccess("Document added successfully! Refreshing...");
      setNewDocForm({
        document_type: "license",
        document_no: "",
        issue_date: "",
        expiry_date: "",
      });
      setDriverStats((prev) => ({ ...prev, driverProfileMissing: false }));

      // Refresh docs
      const updatedDocs = await apiFetch("/api/driver/documents");
      setDriverDocs(updatedDocs);
      setTimeout(() => setDocSuccess(""), 3000);
    } catch (error) {
      setDocError(error.message);
    }
  };

  // --- FUEL HANDLER ---
  const handleFuelChange = (e) =>
    setFuelForm({ ...fuelForm, [e.target.name]: e.target.value });

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
        setFuelForm({
          liters: "",
          totalCost: "",
          stationName: "",
          odometer: "",
        });
      }, 1500);
    } catch (error) {
      setFuelError(error.message);
    }
  };

  // --- INCIDENT HANDLER ---
  const handleIncidentChange = (e) =>
    setIncidentForm({ ...incidentForm, [e.target.name]: e.target.value });

  const submitIncidentLog = async (e) => {
    e.preventDefault();
    setIncidentError("");
    setIncidentSuccess("");
    try {
      const formData = new FormData();
      formData.append("trip_id", activeTrip?.trip_id);
      formData.append("type", incidentForm.type);
      formData.append("severity", incidentForm.severity);
      formData.append("description", incidentForm.description);
      formData.append("reported_to", incidentForm.reportedTo);
      if (incidentPhoto) formData.append("photo", incidentPhoto);

      // NOTE: We use raw fetch here because apiFetch forces Content-Type: application/json
      // FormData requires the browser to automatically set the Content-Type with a boundary.
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/driver/log-incident",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "Failed to report incident");

      setIncidentSuccess("Incident reported successfully.");
      setTimeout(() => {
        setIsIncidentModalOpen(false);
        setIncidentSuccess("");
        setIncidentForm({
          type: "accident",
          severity: "minor",
          description: "",
          reportedTo: "",
        });
        setIncidentPhoto(null);
      }, 1500);
    } catch (error) {
      setIncidentError(error.message);
    }
  };

  // --- MAINTENANCE HANDLER ---
  const handleMaintenanceChange = (e) =>
    setMaintenanceForm({ ...maintenanceForm, [e.target.name]: e.target.value });

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
        setMaintenanceForm({
          serviceType: "repair",
          description: "",
          odometer: "",
          workshop: "",
        });
      }, 1500);
    } catch (error) {
      setMaintenanceError(error.message);
    }
  };

  if (loading)
    return <div style={styles.loadingScreen}>Loading your dashboard...</div>;

  if (!driverStats.hasCompany) {
    return (
      <div style={styles.appContainer}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h1 style={styles.sidebarTitle}>Fleeter OS</h1>
            <p style={styles.sidebarSubtitle}>Welcome, {driverStats.name}</p>
            <p style={styles.sidebarCompany}>Company: No company selected</p>
          </div>
          <div style={styles.logoutContainer}>
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        </aside>
        <main style={styles.mainContent}>
          <section style={styles.dashboardSection}>
            <h2 style={styles.sectionHeader}>Join a company</h2>
            <p style={styles.mutedText}>
              Your driver dashboard will be available after a company approves your request.
            </p>
            <CompanyRequests joinOnly />
          </section>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* ================= LEFT SIDEBAR ================= */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h1 style={styles.sidebarTitle}>Fleeter OS</h1>
          <p style={styles.sidebarSubtitle}>Welcome, {driverStats.name}</p>
          {!driverStats.driverProfileMissing && (
            <p style={styles.sidebarCompany}>🏢 {driverStats.companyName}</p>
          )}
        </div>

        <nav style={styles.navContainer}>
          <div style={styles.navSectionTitle}>Menu</div>
          <button
            onClick={() => setCurrentView("dashboard")}
            style={tabButtonStyle(currentView === "dashboard")}
          >
            🏠 Dashboard
          </button>
          <button
            onClick={() => setCurrentView("history")}
            style={tabButtonStyle(currentView === "history")}
          >
            🕒 Trip History
          </button>

          <div style={styles.navSectionTitleFlex}>
            Trip Actions
            {!canAccessTripFeatures && (
              <span style={styles.lockedBadge}>🔒 LOCKED</span>
            )}
          </div>

          <button
            onClick={() => setIsFuelModalOpen(true)}
            style={actionTabStyle(canAccessTripFeatures, "#3498db")}
            disabled={!canAccessTripFeatures}
          >
            ⛽ Log Fuel
          </button>
          <button
            onClick={() => setIsIncidentModalOpen(true)}
            style={actionTabStyle(canAccessTripFeatures, "#e74c3c")}
            disabled={!canAccessTripFeatures}
          >
            ⚠️ Report Incident
          </button>
          <button
            onClick={() => setIsMaintenanceModalOpen(true)}
            style={actionTabStyle(canAccessTripFeatures, "#f39c12")}
            disabled={!canAccessTripFeatures}
          >
            🔧 Maintenance
          </button>

          <div style={styles.navSectionTitle}>Account</div>
          <button
            onClick={() => setCurrentView("profile")}
            style={tabButtonStyle(currentView === "profile")}
          >
            👤 My Profile & Docs
          </button>
        </nav>

        <div style={styles.logoutContainer}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </aside>

      {/* ================= MIDDLE CONTENT AREA ================= */}
      <main style={styles.mainContent}>
        {driverStats.driverProfileMissing && (
          <div style={styles.alertBoxDanger}>
            ⚠️ <strong>Action Required:</strong> Your account is not linked to a
            Driver profile in the database. Contact your fleet admin to assign
            you to a vehicle.
          </div>
        )}

        {driverStats.alerts > 0 && !driverStats.driverProfileMissing && (
          <div style={styles.alertBoxWarning}>
            ⚠️ <strong>Action Required:</strong> You have {driverStats.alerts}{" "}
            document alert(s) pending. Check your profile.
          </div>
        )}

        {/* --- DASHBOARD VIEW --- */}
        {currentView === "dashboard" && (
          <>
            <section style={styles.dashboardSection}>
              <h2 style={styles.sectionHeader}>Current Trip</h2>
              {activeTrip ? (
                <div style={styles.activeTripCard}>
                  <div style={styles.flexBetweenAlignTop}>
                    <div>
                      <h3 style={styles.tripRouteTitle}>
                        Route: {activeTrip.origin} ➔ {activeTrip.destination}
                      </h3>
                      <p style={styles.tripDetailText}>
                        <strong>Vehicle:</strong> {activeTrip.registration_no}
                      </p>
                      <p style={styles.tripDetailText}>
                        <strong>Started:</strong>{" "}
                        {new Date(activeTrip.departure_time).toLocaleString()}
                      </p>
                    </div>
                    <span style={styles.inProgressBadge}>IN PROGRESS</span>
                  </div>
                  <div style={styles.tripActionRow}>
                    <button
                      style={styles.completeTripBtn}
                      onClick={() => setIsCompleteTripModalOpen(true)}
                    >
                      Complete Trip
                    </button>
                  </div>

                  {/* MAP RENDER */}
                  <div style={{ marginTop: "25px" }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>
                      Live GPS Tracking
                    </h4>
                    {currentPosition ? (
                      <div
                        style={{
                          height: "350px",
                          width: "100%",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: "1px solid #bdc3c7",
                        }}
                      >
                        <MapContainer
                          center={currentPosition}
                          zoom={16}
                          style={{ height: "100%", width: "100%" }}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <LocateControl position={currentPosition} />
                          <Marker position={currentPosition}>
                            <Popup>You are actively tracking.</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "20px",
                          backgroundColor: "#fdf2e9",
                          borderRadius: "8px",
                          color: "#e67e22",
                          fontWeight: "bold",
                        }}
                      >
                        📡 Acquiring GPS signal... Please ensure location
                        permissions are enabled.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={styles.noTripCard}>
                  <h3 style={styles.noTripTitle}>No Active Trip</h3>
                  <p style={styles.noTripText}>
                    You are not currently on the road. Start a scheduled
                    assignment below to unlock your trip tools.
                  </p>
                </div>
              )}
            </section>

            <section>
              <h2 style={styles.sectionHeader}>Upcoming Assignments</h2>
              {futureTrips.length > 0 ? (
                <div style={styles.futureTripsGrid}>
                  {futureTrips.map((trip) => (
                    <div key={trip.trip_id} style={styles.futureTripCard}>
                      <div>
                        <h4 style={styles.futureTripRoute}>
                          {trip.origin} ➔ {trip.destination}
                        </h4>
                        <p style={styles.futureTripDetail}>
                          Vehicle: {trip.registration_no} | Scheduled:{" "}
                          {new Date(trip.departure_time).toLocaleString()}
                        </p>
                      </div>
                      <button
                        style={styles.startBtn}
                        onClick={() => {
                          setTripToStart(trip);
                          setIsStartTripModalOpen(true);
                        }}
                      >
                        Start
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.mutedText}>No upcoming scheduled trips.</p>
              )}
            </section>
          </>
        )}

        {/* --- HISTORY VIEW --- */}
        {currentView === "history" && (
          <section style={styles.dashboardSection}>
            <h2 style={styles.sectionHeader}>Trip History</h2>
            {pastTrips.length > 0 ? (
              <div style={styles.futureTripsGrid}>
                {pastTrips.map((trip) => (
                  <div
                    key={trip.trip_id}
                    style={{
                      ...styles.futureTripCard,
                      borderLeft: "4px solid #95a5a6",
                    }}
                  >
                    <div style={{ width: "100%" }}>
                      <h4 style={styles.futureTripRoute}>
                        {trip.origin} ➔ {trip.destination}
                      </h4>
                      <p style={styles.futureTripDetail}>
                        Vehicle: {trip.registration_no}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          backgroundColor: "#f8f9fa",
                          padding: "10px",
                          borderRadius: "6px",
                          marginTop: "10px",
                        }}
                      >
                        <div style={{ fontSize: "14px" }}>
                          <strong>Started:</strong>
                          <br />
                          {new Date(trip.departure_time).toLocaleString()}
                        </div>
                        <div style={{ fontSize: "14px" }}>
                          <strong>Ended:</strong>
                          <br />
                          {new Date(trip.arrival_time).toLocaleString()}
                        </div>
                        <div style={{ fontSize: "14px", color: "#2980b9" }}>
                          <strong>Total Time:</strong>
                          <br />
                          {calculateDuration(
                            trip.departure_time,
                            trip.arrival_time,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.mutedText}>No completed trips found.</p>
            )}
          </section>
        )}

        {/* --- PROFILE VIEW --- */}
        {currentView === "profile" && (
          <div style={styles.profileContainer}>
            <section style={{ flex: 2 }}>
              <h2 style={styles.sectionHeader}>My Documents</h2>
              {docsLoading ? (
                <p style={styles.mutedText}>Loading documents...</p>
              ) : driverDocs.length === 0 ? (
                <p style={styles.mutedText}>No documents on file.</p>
              ) : (
                <div style={styles.docList}>
                  {driverDocs.map((doc) => {
                    const isExpired = new Date(doc.expiry_date) < new Date();
                    const hasAlert = doc.alert_triggered || isExpired;
                    const borderColor = hasAlert ? "#e74c3c" : "#2ecc71";

                    return (
                      <div
                        key={doc.document_id}
                        style={{
                          ...styles.docCard,
                          borderLeft: `6px solid ${borderColor}`,
                        }}
                      >
                        <div style={styles.flexBetween}>
                          <strong style={styles.docTitle}>
                            {doc.document_type.replace("_", " ")}
                          </strong>
                          <div>
                            {isExpired && (
                              <span style={styles.expiredBadge}>EXPIRED</span>
                            )}
                            <button
                              onClick={() => deleteDocument(doc.document_id)}
                              style={styles.iconBtn}
                              title="Delete Document"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <span style={styles.docSubtitle}>
                          Number: {doc.document_no}
                        </span>
                        <div style={styles.docDates}>
                          <span style={styles.mutedText}>
                            Issued:{" "}
                            {new Date(doc.issue_date).toLocaleDateString()}
                          </span>
                          <span
                            style={{
                              color: hasAlert ? "#c0392b" : "#27ae60",
                              fontWeight: "bold",
                            }}
                          >
                            Expires:{" "}
                            {new Date(doc.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <div style={styles.formsColumn}>
              {/* Account Form */}
              <section style={styles.card}>
                <h3 style={styles.cardHeader}>Account Settings</h3>
                {accountError && (
                  <div style={styles.errorBanner}>{accountError}</div>
                )}
                {accountSuccess && (
                  <div style={styles.successBanner}>{accountSuccess}</div>
                )}
                <form onSubmit={updateAccount} style={styles.form}>
                  <div>
                    <label style={styles.label}>Username</label>
                    <input
                      type="text"
                      name="username"
                      value={accountForm.username}
                      onChange={handleAccountChange}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={accountForm.email}
                      onChange={handleAccountChange}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>New Password (Optional)</label>
                    <input
                      type="password"
                      name="password"
                      value={accountForm.password}
                      onChange={handleAccountChange}
                      style={styles.input}
                      placeholder="••••••••"
                    />
                  </div>
                  <button type="submit" style={styles.primaryBtn}>
                    Save Credentials
                  </button>
                </form>
              </section>

              {/* Document Upload Form */}
              <section style={styles.card}>
                <h3 style={{ ...styles.cardHeader, color: "#8e44ad" }}>
                  + Add New Document
                </h3>
                {docError && <div style={styles.errorBanner}>{docError}</div>}
                {docSuccess && (
                  <div style={styles.successBanner}>{docSuccess}</div>
                )}
                <form onSubmit={submitDocument} style={styles.form}>
                  <div>
                    <label style={styles.label}>Document Type</label>
                    <select
                      name="document_type"
                      value={newDocForm.document_type}
                      onChange={handleDocChange}
                      style={styles.input}
                    >
                      <option value="license">Driver's License</option>
                      <option value="medical">Medical Card</option>
                      <option value="insurance">Insurance Policy</option>
                      <option value="certification">
                        Special Certification
                      </option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Document Number</label>
                    <input
                      type="text"
                      name="document_no"
                      value={newDocForm.document_no}
                      onChange={handleDocChange}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Issue Date</label>
                    <input
                      type="date"
                      name="issue_date"
                      value={newDocForm.issue_date}
                      onChange={handleDocChange}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Expiry Date</label>
                    <input
                      type="date"
                      name="expiry_date"
                      value={newDocForm.expiry_date}
                      min={newDocForm.issue_date}
                      onChange={handleDocChange}
                      required
                      style={styles.input}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ ...styles.primaryBtn, backgroundColor: "#8e44ad" }}
                  >
                    Upload Document
                  </button>
                </form>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODALS ================= */}

      {/* START TRIP MODAL */}
      {isStartTripModalOpen && tripToStart && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <h2 style={{ ...styles.modalTitle, color: "#3498db" }}>
              Start Trip
            </h2>
            <p
              style={{
                color: "#7f8c8d",
                fontSize: "15px",
                marginBottom: "20px",
              }}
            >
              Are you ready to begin your trip to{" "}
              <strong>{tripToStart.destination}</strong>? This will activate
              live GPS tracking.
            </p>
            {startTripError && (
              <div style={styles.errorBanner}>{startTripError}</div>
            )}
            {startTripSuccess && (
              <div style={styles.successBanner}>{startTripSuccess}</div>
            )}
            <div style={styles.modalActionRow}>
              <button
                type="button"
                onClick={() => setIsStartTripModalOpen(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStartTrip}
                style={{ ...styles.submitBtn, backgroundColor: "#3498db" }}
              >
                Yes, Start Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE TRIP MODAL */}
      {isCompleteTripModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <h2 style={{ ...styles.modalTitle, color: "#2ecc71" }}>
              Complete Trip
            </h2>
            <p
              style={{
                color: "#7f8c8d",
                fontSize: "15px",
                marginBottom: "20px",
              }}
            >
              Are you sure you have arrived and want to complete this trip? This
              will stop live tracking.
            </p>
            {completeTripError && (
              <div style={styles.errorBanner}>{completeTripError}</div>
            )}
            {completeTripSuccess && (
              <div style={styles.successBanner}>{completeTripSuccess}</div>
            )}
            <div style={styles.modalActionRow}>
              <button
                type="button"
                onClick={() => setIsCompleteTripModalOpen(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmCompleteTrip}
                style={{ ...styles.submitBtn, backgroundColor: "#2ecc71" }}
              >
                Yes, Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FUEL MODAL */}
      {isFuelModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <h2 style={styles.modalTitle}>Log Fuel Purchase</h2>
            {fuelError && <div style={styles.errorBanner}>{fuelError}</div>}
            {fuelSuccess && (
              <div style={styles.successBanner}>{fuelSuccess}</div>
            )}
            <form onSubmit={submitFuelLog} style={styles.form}>
              <div>
                <label style={styles.label}>Station Name</label>
                <input
                  type="text"
                  name="stationName"
                  value={fuelForm.stationName}
                  onChange={handleFuelChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Liters Filled</label>
                  <input
                    type="number"
                    step="0.01"
                    name="liters"
                    value={fuelForm.liters}
                    onChange={handleFuelChange}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Total Cost (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="totalCost"
                    value={fuelForm.totalCost}
                    onChange={handleFuelChange}
                    required
                    style={styles.input}
                  />
                </div>
              </div>
              <div>
                <label style={styles.label}>Current Odometer (km)</label>
                <input
                  type="number"
                  name="odometer"
                  value={fuelForm.odometer}
                  onChange={handleFuelChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.modalActionRow}>
                <button
                  type="button"
                  onClick={() => setIsFuelModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  Submit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INCIDENT MODAL */}
      {isIncidentModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <h2 style={{ ...styles.modalTitle, color: "#c0392b" }}>
              Report Incident
            </h2>
            {incidentError && (
              <div style={styles.errorBanner}>{incidentError}</div>
            )}
            {incidentSuccess && (
              <div style={styles.successBanner}>{incidentSuccess}</div>
            )}
            <form onSubmit={submitIncidentLog} style={styles.form}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Incident Type</label>
                  <select
                    name="type"
                    value={incidentForm.type}
                    onChange={handleIncidentChange}
                    style={styles.input}
                  >
                    <option value="accident">Accident</option>
                    <option value="breakdown">Breakdown</option>
                    <option value="traffic_violation">Traffic Violation</option>
                    <option value="theft">Theft</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Severity</label>
                  <select
                    name="severity"
                    value={incidentForm.severity}
                    onChange={handleIncidentChange}
                    style={styles.input}
                  >
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={styles.label}>Description of Incident</label>
                <textarea
                  name="description"
                  value={incidentForm.description}
                  onChange={handleIncidentChange}
                  required
                  style={styles.textarea}
                />
              </div>
              <div>
                <label style={styles.label}>
                  Reported To (Authority/Police)
                </label>
                <input
                  type="text"
                  name="reportedTo"
                  value={incidentForm.reportedTo}
                  onChange={handleIncidentChange}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Attach Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setIncidentPhoto(e.target.files[0])}
                  style={styles.input}
                />
              </div>
              <div style={styles.modalActionRow}>
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.submitBtn, backgroundColor: "#e74c3c" }}
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAINTENANCE MODAL */}
      {isMaintenanceModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <h2 style={{ ...styles.modalTitle, color: "#e67e22" }}>
              Request Maintenance
            </h2>
            {maintenanceError && (
              <div style={styles.errorBanner}>{maintenanceError}</div>
            )}
            {maintenanceSuccess && (
              <div style={styles.successBanner}>{maintenanceSuccess}</div>
            )}
            <form onSubmit={submitMaintenanceRequest} style={styles.form}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Service Type</label>
                  <select
                    name="serviceType"
                    value={maintenanceForm.serviceType}
                    onChange={handleMaintenanceChange}
                    style={styles.input}
                  >
                    <option value="repair">Repair</option>
                    <option value="routine">Routine Service</option>
                    <option value="inspection">Inspection</option>
                    <option value="emergency">Emergency Breakdown</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Current Odometer</label>
                  <input
                    type="number"
                    name="odometer"
                    value={maintenanceForm.odometer}
                    onChange={handleMaintenanceChange}
                    required
                    style={styles.input}
                  />
                </div>
              </div>
              <div>
                <label style={styles.label}>Issue Description</label>
                <textarea
                  name="description"
                  value={maintenanceForm.description}
                  onChange={handleMaintenanceChange}
                  required
                  style={styles.textarea}
                />
              </div>
              <div>
                <label style={styles.label}>
                  Preferred Workshop (Optional)
                </label>
                <input
                  type="text"
                  name="workshop"
                  value={maintenanceForm.workshop}
                  onChange={handleMaintenanceChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.modalActionRow}>
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.submitBtn, backgroundColor: "#f39c12" }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- DYNAMIC STYLE HELPERS ---
const tabButtonStyle = (isActive) => ({
  width: "100%",
  textAlign: "left",
  padding: "15px 20px",
  backgroundColor: isActive ? "#34495e" : "transparent",
  color: "white",
  border: "none",
  borderLeft: isActive ? "4px solid #3498db" : "4px solid transparent",
  cursor: "pointer",
  fontSize: "15px",
});
const actionTabStyle = (isEnabled, activeColor) => ({
  width: "100%",
  textAlign: "left",
  padding: "15px 20px",
  backgroundColor: "transparent",
  color: isEnabled ? "white" : "#7f8c8d",
  border: "none",
  borderLeft: `4px solid ${isEnabled ? activeColor : "transparent"}`,
  cursor: isEnabled ? "pointer" : "not-allowed",
  fontSize: "15px",
  opacity: isEnabled ? 1 : 0.4,
});

// --- CENTRALIZED STATIC STYLES ---
const styles = {
  // App Layout & Utils
  loadingScreen: { padding: "20px", textAlign: "center" },
  appContainer: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f4f7f6",
    fontFamily: "sans-serif",
  },
  mainContent: { flex: 1, padding: "30px", overflowY: "auto" },
  mutedText: { color: "#7f8c8d" },
  flexBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  flexBetweenAlignTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  errorBanner: {
    backgroundColor: "#ffe6e6",
    color: "#cc0000",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #cc0000",
    marginBottom: "15px",
    fontSize: "14px",
  },
  successBanner: {
    backgroundColor: "#e8f8f5",
    color: "#27ae60",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #27ae60",
    marginBottom: "15px",
    fontSize: "14px",
  },

  // Sidebar
  sidebar: {
    width: "260px",
    backgroundColor: "#2c3e50",
    color: "white",
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: { padding: "20px", borderBottom: "1px solid #34495e" },
  sidebarTitle: { margin: 0, fontSize: "22px" },
  sidebarSubtitle: { margin: "5px 0 0 0", fontSize: "14px", color: "#bdc3c7" },
  sidebarCompany: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "#3498db",
    fontWeight: "bold",
  },
  navContainer: {
    flex: 1,
    padding: "20px 0",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  navSectionTitle: {
    padding: "0 20px",
    fontSize: "12px",
    color: "#7f8c8d",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  navSectionTitleFlex: {
    padding: "10px 20px 0 20px",
    fontSize: "12px",
    color: "#7f8c8d",
    textTransform: "uppercase",
    fontWeight: "bold",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lockedBadge: {
    color: "#e74c3c",
    fontSize: "10px",
    backgroundColor: "rgba(231, 76, 60, 0.2)",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  logoutContainer: { padding: "20px" },
  logoutBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#c0392b",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  // Alerts
  alertBoxDanger: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "30px",
    borderLeft: "5px solid #f5c6cb",
  },
  alertBoxWarning: {
    backgroundColor: "#fff3cd",
    color: "#856404",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "30px",
    borderLeft: "5px solid #ffeeba",
  },

  // Dashboard - Active Trip
  dashboardSection: { marginBottom: "40px" },
  sectionHeader: {
    marginTop: 0,
    color: "#2c3e50",
    borderBottom: "2px solid #ecf0f1",
    paddingBottom: "10px",
  },
  activeTripCard: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "12px",
    borderLeft: "6px solid #2ecc71",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  tripRouteTitle: { margin: "0 0 10px 0", fontSize: "20px" },
  tripDetailText: { margin: "5px 0", color: "#7f8c8d" },
  inProgressBadge: {
    backgroundColor: "#e8f8f5",
    color: "#27ae60",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  tripActionRow: { marginTop: "20px", display: "flex", gap: "10px" },
  completeTripBtn: {
    padding: "12px 25px",
    backgroundColor: "#2ecc71",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  noTripCard: {
    backgroundColor: "#fff5f5",
    padding: "30px",
    borderRadius: "12px",
    textAlign: "center",
    color: "#c0392b",
    border: "2px dashed #e74c3c",
  },
  noTripTitle: { margin: "0 0 10px 0" },
  noTripText: { margin: 0 },

  // Dashboard - Future Trips
  futureTripsGrid: { display: "grid", gap: "15px" },
  futureTripCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    borderLeft: "4px solid #3498db",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  futureTripRoute: { margin: "0 0 5px 0", fontSize: "16px" },
  futureTripDetail: { margin: 0, fontSize: "13px", color: "#7f8c8d" },
  startBtn: {
    padding: "10px 20px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  // Profile View
  profileContainer: { display: "flex", gap: "30px", alignItems: "flex-start" },
  docList: { display: "flex", flexDirection: "column", gap: "15px" },
  docCard: {
    border: "1px solid #eee",
    padding: "20px",
    borderRadius: "8px",
    backgroundColor: "white",
  },
  docTitle: { fontSize: "18px", textTransform: "uppercase", color: "#2c3e50" },
  expiredBadge: { color: "#e74c3c", fontWeight: "bold", marginRight: "15px" },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    padding: 0,
  },
  docSubtitle: {
    fontSize: "15px",
    color: "#7f8c8d",
    display: "block",
    marginTop: "5px",
  },
  docDates: {
    display: "flex",
    gap: "20px",
    marginTop: "10px",
    fontSize: "14px",
  },
  formsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    flex: 1,
  },
  card: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  cardHeader: { marginTop: 0, color: "#2c3e50", marginBottom: "15px" },

  // General Forms & Modals
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  label: {
    display: "block",
    fontSize: "14px",
    color: "#7f8c8d",
    marginBottom: "5px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    minHeight: "80px",
    resize: "vertical",
  },
  primaryBtn: {
    padding: "12px",
    backgroundColor: "#34495e",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
    boxSizing: "border-box",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "450px",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalTitle: { marginTop: 0, color: "#2c3e50", marginBottom: "15px" },
  modalActionRow: { display: "flex", gap: "10px", marginTop: "10px" },
  cancelBtn: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#ecf0f1",
    color: "#7f8c8d",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  submitBtn: {
    flex: 1,
    padding: "12px",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    backgroundColor: "#3498db",
  },
};

export default DriverDashboard;
