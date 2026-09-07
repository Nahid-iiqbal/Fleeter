import React, { useEffect, useState } from "react";
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

function ManagerDetails({ managerId, onBack }) {
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchManager = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await apiFetch(`/api/company/managers/${managerId}`);
        setManager(data);
      } catch (err) {
        console.error("Error loading manager:", err);
        setError(err.message || "Unable to load manager information.");
      } finally {
        setLoading(false);
      }
    };

    fetchManager();
  }, [managerId]);

  if (loading) {
    return <div style={{ padding: "30px" }}>Loading manager profile...</div>;
  }

  if (error || !manager) {
    return (
      <div style={{ padding: "30px" }}>
        <button onClick={onBack} style={backButtonStyle}>
          ← Back to Managers
        </button>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Manager Unavailable</h2>
          <p style={{ color: error ? "#cc0000" : "#7f8c8d" }}>
            {error || "This manager could not be found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f7f6" }}>
      <main style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
        <button onClick={onBack} style={backButtonStyle}>
          ← Back to Managers
        </button>

        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={avatarStyle}>
              {manager.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ margin: 0, color: "#2c3e50" }}>{manager.full_name}</h1>
              <p style={{ margin: "6px 0 0", color: "#7f8c8d" }}>
                Manager #{manager.manager_id}
              </p>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: "#2c3e50" }}>Manager Information</h2>
          <div style={gridStyle}>
            <ProfileField label="Full Name" value={manager.full_name} />
            <ProfileField label="Employee ID" value={manager.employee_id} />
            <ProfileField label="Department" value={manager.department} />
            <ProfileField label="Phone" value={manager.phone} />
            <ProfileField label="Username" value={manager.username} />
            <ProfileField label="Email" value={manager.email} />
            <ProfileField
              label="Account Status"
              value={manager.is_active ? "Active" : "Inactive"}
            />
            <ProfileField
              label="Joined Date"
              value={manager.created_at?.split("T")[0]}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value || "Not provided"}</div>
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "25px",
};

const avatarStyle = {
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
};

const backButtonStyle = {
  background: "none",
  border: "none",
  padding: 0,
  color: "#3498db",
  cursor: "pointer",
  fontSize: "14px",
  marginBottom: "20px",
};

export default ManagerDetails;