import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function DriverDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Real data state
  const [driverStats, setDriverStats] = useState({
    name: "Loading...",
    activeTrip: null,
    alerts: 0,
  });

  // Modal State
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState({
    liters: "",
    totalCost: "",
    stationName: "",
    odometer: "",
  });
  const [fuelSubmitMsg, setFuelSubmitMsg] = useState("");

  // Incident Modal State
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    type: "accident",
    severity: "minor",
    description: "",
    reportedTo: "",
  });
  const [incidentSubmitMsg, setIncidentSubmitMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchDriverData = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/driver/active-trip",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.status === 401) {
          localStorage.clear();
          navigate("/login");
          return;
        }

        const data = await response.json();
        setDriverStats({
          name: data.name,
          activeTrip: data.activeTrip,
          alerts: 0, // We can build the document alert route later
        });
      } catch (error) {
        console.error("Failed to load driver data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleFuelChange = (e) => {
    setFuelForm({ ...fuelForm, [e.target.name]: e.target.value });
  };

  const submitFuelLog = async (e) => {
    e.preventDefault();
    setFuelSubmitMsg("Submitting...");

    try {
      const token = localStorage.getItem("token");

      // Calculate cost per liter for the database schema requirement
      const liters = parseFloat(fuelForm.liters);
      const totalCost = parseFloat(fuelForm.totalCost);
      const costPerLiter = (totalCost / liters).toFixed(2);

      const response = await fetch(
        "http://localhost:5000/api/driver/log-fuel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            vehicle_id: driverStats.activeTrip?.vehicle_id,
            trip_id: driverStats.activeTrip?.trip_id,
            liters: liters,
            total_cost: totalCost,
            cost_per_liter: costPerLiter,
            odometer_km: parseInt(fuelForm.odometer),
            station_name: fuelForm.stationName,
          }),
        },
      );

      if (response.ok) {
        setFuelSubmitMsg("Fuel logged successfully!");
        setTimeout(() => {
          setIsFuelModalOpen(false);
          setFuelSubmitMsg("");
          setFuelForm({
            liters: "",
            totalCost: "",
            stationName: "",
            odometer: "",
          });
        }, 1500);
      } else {
        setFuelSubmitMsg("Failed to log fuel. Try again.");
      }
    } catch (error) {
      console.error(error);
      setFuelSubmitMsg("Network error.");
    }
  };

  const handleIncidentChange = (e) => {
    setIncidentForm({ ...incidentForm, [e.target.name]: e.target.value });
  };

  const submitIncidentLog = async (e) => {
    e.preventDefault();
    setIncidentSubmitMsg("Submitting...");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/driver/log-incident",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            trip_id: driverStats.activeTrip?.trip_id,
            type: incidentForm.type,
            severity: incidentForm.severity,
            description: incidentForm.description,
            reported_to: incidentForm.reportedTo,
          }),
        },
      );

      if (response.ok) {
        setIncidentSubmitMsg("Incident reported successfully.");
        setTimeout(() => {
          setIsIncidentModalOpen(false);
          setIncidentSubmitMsg("");
          setIncidentForm({
            type: "accident",
            severity: "minor",
            description: "",
            reportedTo: "",
          });
        }, 1500);
      } else {
        setIncidentSubmitMsg("Failed to report incident. Try again.");
      }
    } catch (error) {
      console.error(error);
      setIncidentSubmitMsg("Network error.");
    }
  };

  if (loading)
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Loading your dashboard...
      </div>
    );

  return (
    <div
      style={{
        backgroundColor: "#f4f7f6",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        paddingBottom: "80px",
        position: "relative",
      }}
    >
      <header
        style={{
          backgroundColor: "#2c3e50",
          color: "white",
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "20px" }}>Fleeter Driver</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#bdc3c7" }}>
            Welcome, {driverStats.name}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "transparent",
            color: "white",
            border: "1px solid white",
            padding: "5px 10px",
            borderRadius: "5px",
          }}
        >
          Logout
        </button>
      </header>

      <main style={{ padding: "15px", maxWidth: "600px", margin: "0 auto" }}>
        {driverStats.alerts > 0 && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              color: "#856404",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            ⚠️ You have {driverStats.alerts} document alert.
          </div>
        )}

        {/* Active Trip Card */}
        <section
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: "16px",
              color: "#7f8c8d",
              textTransform: "uppercase",
            }}
          >
            Current Assignment
          </h2>

          {driverStats.activeTrip ? (
            <div>
              <div
                style={{
                  marginBottom: "15px",
                  fontSize: "16px",
                  lineHeight: "1.5",
                }}
              >
                <strong>Vehicle:</strong>{" "}
                {driverStats.activeTrip.registration_no} <br />
                <strong>From:</strong> {driverStats.activeTrip.origin} <br />
                <strong>To:</strong> {driverStats.activeTrip.destination}
              </div>
              <button
                style={{
                  width: "100%",
                  padding: "15px",
                  backgroundColor: "#2ecc71",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                Update Trip Status
              </button>
            </div>
          ) : (
            <p style={{ color: "#95a5a6" }}>
              No active trips assigned right now.
            </p>
          )}
        </section>

        {/* Quick Actions */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          <button
            onClick={() => setIsFuelModalOpen(true)}
            style={actionButtonStyle(
              driverStats.activeTrip ? "#3498db" : "#bdc3c7",
            )}
            disabled={!driverStats.activeTrip} // Prevent logging fuel if no vehicle is assigned
          >
            ⛽ Log Fuel
          </button>
          <button
            onClick={() => setIsIncidentModalOpen(true)}
            style={actionButtonStyle(
              driverStats.activeTrip ? "#e74c3c" : "#bdc3c7",
            )}
            disabled={!driverStats.activeTrip}
          >
            ⚠️ Report Incident
          </button>
          <button style={actionButtonStyle("#f39c12")}>
            🔧 Maintenance Request
          </button>
          <button style={actionButtonStyle("#9b59b6")}>📄 My Documents</button>
        </section>
      </main>

      {/* --- FUEL LOG MODAL --- */}
      {isFuelModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "400px",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#2c3e50" }}>
              Log Fuel Purchase
            </h2>

            <form
              onSubmit={submitFuelLog}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div>
                <label style={labelStyle}>Station Name</label>
                <input
                  type="text"
                  name="stationName"
                  value={fuelForm.stationName}
                  onChange={handleFuelChange}
                  required
                  style={inputStyle}
                  placeholder="e.g. Shell, Highway 61"
                />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Liters Filled</label>
                  <input
                    type="number"
                    step="0.01"
                    name="liters"
                    value={fuelForm.liters}
                    onChange={handleFuelChange}
                    required
                    style={inputStyle}
                    placeholder="0.00"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Total Cost (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="totalCost"
                    value={fuelForm.totalCost}
                    onChange={handleFuelChange}
                    required
                    style={inputStyle}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Current Odometer (km)</label>
                <input
                  type="number"
                  name="odometer"
                  value={fuelForm.odometer}
                  onChange={handleFuelChange}
                  required
                  style={inputStyle}
                  placeholder="150240"
                />
              </div>

              {fuelSubmitMsg && (
                <p
                  style={{
                    color: fuelSubmitMsg.includes("success") ? "green" : "red",
                    margin: "5px 0 0 0",
                    fontSize: "14px",
                  }}
                >
                  {fuelSubmitMsg}
                </p>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsFuelModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#ecf0f1",
                    color: "#7f8c8d",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#3498db",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                  }}
                >
                  Submit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- INCIDENT LOG MODAL --- */}
      {isIncidentModalOpen && (
        <div
          style={{
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
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "450px",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#c0392b" }}>Report Incident</h2>

            <form
              onSubmit={submitIncidentLog}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Incident Type</label>
                  <select
                    name="type"
                    value={incidentForm.type}
                    onChange={handleIncidentChange}
                    style={inputStyle}
                  >
                    <option value="accident">Accident</option>
                    <option value="breakdown">Breakdown</option>
                    <option value="traffic_violation">Traffic Violation</option>
                    <option value="theft">Theft</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Severity</label>
                  <select
                    name="severity"
                    value={incidentForm.severity}
                    onChange={handleIncidentChange}
                    style={inputStyle}
                  >
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description of Incident</label>
                <textarea
                  name="description"
                  value={incidentForm.description}
                  onChange={handleIncidentChange}
                  required
                  style={{
                    ...inputStyle,
                    minHeight: "80px",
                    resize: "vertical",
                  }}
                  placeholder="What happened? Was anyone injured? Is the vehicle drivable?"
                />
              </div>

              <div>
                <label style={labelStyle}>Reported To (Authority/Police)</label>
                <input
                  type="text"
                  name="reportedTo"
                  value={incidentForm.reportedTo}
                  onChange={handleIncidentChange}
                  style={inputStyle}
                  placeholder="e.g., Highway Patrol, None"
                />
              </div>

              {incidentSubmitMsg && (
                <p
                  style={{
                    color: incidentSubmitMsg.includes("success")
                      ? "green"
                      : "red",
                    margin: "5px 0 0 0",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  {incidentSubmitMsg}
                </p>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#ecf0f1",
                    color: "#7f8c8d",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                  }}
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const actionButtonStyle = (color) => ({
  backgroundColor: "white",
  color: color,
  border: `2px solid ${color}`,
  padding: "20px",
  borderRadius: "12px",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "10px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
});

const labelStyle = {
  display: "block",
  fontSize: "14px",
  color: "#7f8c8d",
  marginBottom: "5px",
  fontWeight: "bold",
};
const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  boxSizing: "border-box",
};

export default DriverDashboard;
