import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function OwnerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // We will eventually fetch real data here
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeDrivers: 0,
    alerts: 0,
  });

  useEffect(() => {
    // 1. Grab the token from local storage
    const token = localStorage.getItem("token");

    // 2. If there is no token, bounce them to login
    if (!token) {
      navigate("/login");
      return;
    }

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

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading)
    return <div style={{ padding: "20px" }}>Loading your dashboard...</div>;

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
          Fleeter OS
        </div>
        <nav style={{ flex: 1, padding: "20px 0" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li
              onClick={() => setActiveTab("overview")}
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
              onClick={() => setActiveTab("map")}
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
              onClick={() => setActiveTab("vehicles")}
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
              onClick={() => setActiveTab("drivers")}
              style={{
                padding: "15px 20px",
                cursor: "pointer",
                backgroundColor:
                  activeTab === "drivers" ? "#34495e" : "transparent",
              }}
            >
              Drivers
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
            Logged in as: <strong>Owner</strong>
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
          {activeTab === "map" && (
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                minHeight: "600px",
                border: "1px solid #e0e0e0",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#95a5a6",
              }}
            >
              Interactive Leaflet/Google Map Component
            </div>
          )}

          {/* VEHICLES TAB CONTENT */}
          {activeTab === "vehicles" && (
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
              }}
            >
              <h2>Fleet Inventory</h2>
              <p>List of all vehicles will be rendered here.</p>
            </div>
          )}

          {/* DRIVERS TAB CONTENT */}
          {activeTab === "drivers" && (
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
              }}
            >
              <h2>Driver Management</h2>
              <p>List of drivers and their statuses will be rendered here.</p>
            </div>
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
