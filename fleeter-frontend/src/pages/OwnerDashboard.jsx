import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// import driver and vehicle details for the details page
import DriverDetails from "./DriverDetails";
import VehicleDetails from "./VehicleDetails";

// import tables to show the list
import DriversTable from "../components/DriversTable";
import VehiclesTable from "../components/VehiclesTable";
import CompanyRequests from "../components/CompanyRequests";
import LiveMap from "../components/LiveMap";
import { apiFetch } from "../utils/api";

// Table styles (Header and cell)
const tableHeaderStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "2px solid #ddd",
  color: "#555",
};

const tableCellStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
};
function OwnerDashboard() {
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

  const [loading, setLoading] = useState(true);

  // Var for fetching Drivers data
  const [drivers, setDrivers] = useState([]);
  const [driversLoaded, setDriversLoaded] = useState(false); // checks if already loaded
  const [driversLoading, setDriversLoading] = useState(false); // can be used for loading screen later
  const [driversError, setDriversError] = useState("");

  // Same thing for Vehicles data
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // We will eventually fetch real data here
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
    if (activeTab !== "drivers") {
      return;
    }

    // Already fetched → don't fetch again
    if (driversLoaded) {
      return;
    }

    fetchDrivers();
  }, [activeTab, driversLoaded, fetchDrivers]);

  // useEffect for Vehicles data
  // Load vehicles only when the Vehicles tab is opened
  useEffect(() => {
    if (activeTab !== "vehicles") {
      return;
    }

    if (vehiclesLoaded) {
      return;
    }

    fetchVehicles();
  }, [activeTab, vehiclesLoaded, fetchVehicles]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading || !companyContext)
    return <div style={{ padding: "20px" }}>Loading your dashboard...</div>;

  if (!companyContext.hasCompany) {
    return (
      <div style={styles.requestOnlyShell}>
        <header style={styles.requestOnlyHeader}>
          <strong>Fleeter OS</strong>
          <span>Company: No company selected</span>
        </header>
        <main style={styles.requestOnlyContent}>
          <h1>Join a company</h1>
          <p>You need an approved company membership before dashboard access is enabled.</p>
          <CompanyRequests joinOnly />
        </main>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "sans-serif",
        backgroundColor: "#f4f7f6",
      }}
    >
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: "250px",
          backgroundColor: "#2c3e50",
          color: "white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px",
            fontSize: "24px",
            fontWeight: "bold",
            borderBottom: "1px solid #34495e",
          }}
        >
          <div>Fleeter OS</div>
          <div style={styles.companyIndicator}>
            Company: {companyContext.companyName || "Unnamed company"}
          </div>
        </div>
        <nav style={{ flex: 1, padding: "20px 0" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li
              onClick={() => navigate("/dashboard/overview")}
              style={{
                padding: "15px 20px",
                cursor: "pointer",
                backgroundColor:
                  activeTab === "overview" ? "#34495e" : "transparent",
              }}
            >
              Dashboard Overview
            </li>
            <li
              onClick={() => navigate("/dashboard/map")}
              style={{
                padding: "15px 20px",
                cursor: "pointer",
                backgroundColor:
                  activeTab === "map" ? "#34495e" : "transparent",
              }}
            >
              Live Map
            </li>
            <li
              onClick={() => navigate("/dashboard/vehicles")}
              style={{
                padding: "15px 20px",
                cursor: "pointer",
                backgroundColor:
                  activeTab === "vehicles" ? "#34495e" : "transparent",
              }}
            >
              Vehicles
            </li>
            <li
              onClick={() => navigate("/dashboard/drivers")}
              style={{
                padding: "15px 20px",
                cursor: "pointer",
                backgroundColor:
                  activeTab === "drivers" ? "#34495e" : "transparent",
              }}
            >
              Drivers
            </li>
            <li
              onClick={() => navigate("/dashboard/recruit")}
              style={{
                padding: "15px 20px",
                cursor: "pointer",
                backgroundColor:
                  activeTab === "recruit" ? "#34495e" : "transparent",
              }}
            >
              Recruit
            </li>
          </ul>
        </nav>
        <div style={{ padding: "20px" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top Header */}
        <header
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "24px", color: "#333" }}>
            Command Center
          </h1>
          <div style={{ color: "#7f8c8d" }}>
            Logged in as: <strong>{userRole}</strong>
          </div>
        </header>

        {/* Dashboard Widgets */}
        <div style={{ padding: "20px", overflowY: "auto" }}>
          {/* OVERVIEW TAB CONTENT */}
          {activeTab === "overview" && (
            <>
              {/* Metrics Row */}
              <div
                style={{ display: "flex", gap: "20px", marginBottom: "20px" }}
              >
                <MetricCard
                  title="Total Vehicles"
                  value={stats.totalVehicles}
                  color="#3498db"
                />
                <MetricCard
                  title="Active Drivers"
                  value={stats.activeDrivers}
                  color="#2ecc71"
                />
                <MetricCard
                  title="System Alerts"
                  value={stats.alerts}
                  color="#e67e22"
                />
              </div>

              {/* Placeholder for Analytics */}
              <div
                style={{
                  backgroundColor: "white",
                  padding: "20px",
                  borderRadius: "8px",
                  minHeight: "400px",
                  border: "1px solid #e0e0e0",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#95a5a6",
                }}
              >
                Overview Analytics Will Go Here
              </div>
            </>
          )}

          {/* LIVE MAP TAB CONTENT */}
          {activeTab === "map" && <LiveMap />}


          {/* VEHICLES TAB CONTENT */}
          {activeTab === "vehicles" && (
            selectedVehicleId ? (
              <VehicleDetails
                vehicleId={selectedVehicleId}
                onBack={() => navigate("/dashboard/vehicles")}
              />
            ) : (
              <VehiclesTable
                vehicles={vehicles}
                vehiclesLoading={vehiclesLoading}
                onRefresh={fetchVehicles}
                onVehicleClick={(vehicleId) =>
                  navigate(`/dashboard/vehicles/${vehicleId}`)
                }
                onDriverClick={(driverId) =>
                  navigate(`/dashboard/drivers/${driverId}`)
                }
              />
            )
          )}


          {/* DRIVERS TAB CONTENT */}
          {activeTab === "drivers" && (
            selectedDriverId ? (
              <DriverDetails
                driverId={selectedDriverId}
                onBack={() => navigate("/dashboard/drivers")}
              />
            ) : (
              <DriversTable
                drivers={drivers}
                driversLoading={driversLoading}
                error={driversError}
                onRefresh={fetchDrivers}
                onDriverClick={(driverId) =>
                  navigate(`/dashboard/drivers/${driverId}`)
                }
              />
            )
          )}

          {activeTab === "recruit" && (
            <CompanyRequests showJoinRequest={!companyContext.hasCompany} />
          )}

        </div>
      </main>
    </div>
  );
}

// A simple reusable UI component for the stats blocks
function MetricCard({ title, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        borderLeft: `5px solid ${color}`,
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <h3
        style={{
          margin: "0 0 10px 0",
          color: "#7f8c8d",
          fontSize: "14px",
          textTransform: "uppercase",
        }}
      >
        {title}
      </h3>
      <div style={{ fontSize: "32px", fontWeight: "bold", color: "#2c3e50" }}>
        {value}
      </div>
    </div>
  );
}

export default OwnerDashboard;

const styles = {
  requestOnlyShell: {
    minHeight: "100vh",
    backgroundColor: "#f4f7f6",
    fontFamily: "sans-serif",
  },
  requestOnlyHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "20px 30px",
    backgroundColor: "#2c3e50",
    color: "white",
  },
  requestOnlyContent: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  companyIndicator: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#d5e8f7",
  },
};
