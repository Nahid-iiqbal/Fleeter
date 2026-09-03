import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

const cardStyle = {
  backgroundColor: "white",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
  padding: "24px",
  marginBottom: "20px",
};

const labelStyle = {
  fontSize: "12px",
  color: "#7f8c8d",
  textTransform: "uppercase",
  marginBottom: "6px",
};

const valueStyle = {
  fontSize: "16px",
  color: "#2c3e50",
  fontWeight: "500",
};

function DriverDetails({ driverId, onBack }) {
  const navigate = useNavigate();

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        setLoading(true);
        setError("");


        const data = await apiFetch(`/api/drivers/${driverId}`);
        setDriver(data);
      } catch (err) {
        console.error("Error loading driver:", err);
        setError(err.message || "Unable to load driver information.");
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, [driverId]); 

  const getStatusStyle = (status) => {
    switch (status) {
      case "active":
        return { backgroundColor: "#d5f5e3", color: "#1e8449" };
      case "on_leave":
        return { backgroundColor: "#fcf3cf", color: "#9a7d0a" };
      case "suspended":
        return { backgroundColor: "#fadbd8", color: "#c0392b" };
      case "terminated":
        return { backgroundColor: "#eaecee", color: "#566573" };
      default:
        return { backgroundColor: "#eaecee", color: "#566573" };
    }
  };

  if (loading) {
    return (
      <div
        style={{ padding: "30px", fontFamily: "sans-serif", color: "#2c3e50" }}
      >
        Loading driver profile...
      </div>
    );
  }

  // 4. Render the caught error message cleanly
  if (error || !driver) {
    return (
      <div style={{ padding: "30px", fontFamily: "sans-serif" }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: "#3498db",
            cursor: "pointer",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          ← Back to Drivers
        </button>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Driver Unavailable</h2>
          {error ? (
            <div
              style={{
                backgroundColor: "#ffe6e6",
                color: "#cc0000",
                padding: "15px",
                borderRadius: "5px",
                border: "1px solid #cc0000",
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          ) : (
            <p style={{ color: "#7f8c8d" }}>This driver could not be found.</p>
          )}
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(driver.status);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f7f6",
        fontFamily: "sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "white",
          padding: "20px 30px",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", color: "#2c3e50" }}>
            Driver Profile
          </h1>
          <div style={{ marginTop: "5px", color: "#7f8c8d", fontSize: "14px" }}>
            Driver ID #{driver.driver_id}
          </div>
        </div>
      </header>

      <main style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            padding: "0",
            color: "#3498db",
            cursor: "pointer",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          ← Back
        </button>

        {/* Driver identity card */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
              {/* Avatar */}
              <div
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  backgroundColor: "#3498db",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  fontWeight: "bold",
                }}
              >
                {driver.full_name?.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 style={{ margin: 0, fontSize: "26px", color: "#2c3e50" }}>
                  {driver.full_name}
                </h2>
                <p style={{ margin: "6px 0 0", color: "#7f8c8d" }}>
                  Driver #{driver.driver_id}
                </p>
              </div>
            </div>

            {/* Status */}
            <span
              style={{
                ...statusStyle,
                padding: "8px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "bold",
                textTransform: "capitalize",
              }}
            >
              {driver.status?.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Personal Information */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#2c3e50" }}>
            Personal Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "25px",
            }}
          >
            <div>
              <div style={labelStyle}>Full Name</div>
              <div style={valueStyle}>{driver.full_name}</div>
            </div>

            <div>
              <div style={labelStyle}>Phone</div>
              <div style={valueStyle}>{driver.phone || "Not provided"}</div>
            </div>

            <div>
              <div style={labelStyle}>Username</div>
              <div style={valueStyle}>{driver.username || "Not linked"}</div>
            </div>

            <div>
              <div style={labelStyle}>Email</div>
              <div style={valueStyle}>{driver.email || "Not provided"}</div>
            </div>

            <div>
              <div style={labelStyle}>Joined Date</div>
              <div style={valueStyle}>
                {driver.joined_date || "Not provided"}
              </div>
            </div>
          </div>
        </div>

        {/* License Information */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#2c3e50" }}>
            License Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "25px",
            }}
          >
            <div>
              <div style={labelStyle}>Document Number</div>
              <div style={valueStyle}>
                {driver.document_no || "Not provided"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Document Type</div>
              <div style={valueStyle}>
                {driver.document_type?.replaceAll("_", " ") || "Not provided"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Issue Date</div>
              <div style={valueStyle}>
                {driver.document_issue_date || "Not provided"}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Expiry Date</div>
              <div style={valueStyle}>
                {driver.document_expiry_date || "Not provided"}
              </div>
            </div>
          </div>
        </div>

        {/* Account / Record Information */}
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#2c3e50" }}>
            Record Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "25px",
            }}
          >
            <div>
              <div style={labelStyle}>Driver ID</div>
              <div style={valueStyle}>{driver.driver_id}</div>
            </div>

            <div>
              <div style={labelStyle}>Created At</div>
              <div style={valueStyle}>{driver.created_at}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DriverDetails;
