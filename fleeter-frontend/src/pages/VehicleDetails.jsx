import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

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

function VehicleDetails({ vehicleId, onBack }) {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        setError("");

        // 2. Replaced raw fetch with centralized apiFetch utility
        const data = await apiFetch(`/api/vehicles/${vehicleId}`);
        setVehicle(data);
      } catch (err) {
        console.error("Error loading vehicle:", err);
        // Catch 403, 404, or 500 errors and set them to state
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "10px",
          border: "1px solid #e0e0e0",
          textAlign: "center",
          color: "#7f8c8d",
        }}
      >
        Loading vehicle details...
      </div>
    );
  }

  // 3. Render the explicit error message if the fetch failed
  if (error || !vehicle) {
    return (
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "10px",
          border: "1px solid #e0e0e0",
        }}
      >
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
          ← Back to Vehicles
        </button>

        <h2>Vehicle Unavailable</h2>
        {/* Visible Error Feedback Box */}
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
          <p style={{ color: "#7f8c8d" }}>
            We couldn't find the requested vehicle.
          </p>
        )}
      </div>
    );
  }

  const statusColors = {
    active: "#2ecc71",
    in_maintenance: "#e67e22",
    retired: "#95a5a6",
  };

  const statusColor = statusColors[vehicle.condition_status] || "#7f8c8d";

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          color: "#3498db",
          cursor: "pointer",
          fontSize: "14px",
          marginBottom: "15px",
        }}
      >
        ← Back to Vehicles
      </button>

      {/* Profile Header */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          border: "1px solid #e0e0e0",
          padding: "25px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
            }}
          >
            {/* Vehicle Icon */}
            <div
              style={{
                width: "65px",
                height: "65px",
                borderRadius: "12px",
                backgroundColor: "#3498db",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
              }}
            >
              🚛
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  color: "#2c3e50",
                  fontSize: "26px",
                }}
              >
                {vehicle.registration_no}
              </h1>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#7f8c8d",
                  fontSize: "15px",
                }}
              >
                {vehicle.brand || "Unknown Brand"} {vehicle.model || ""}
              </p>
            </div>
          </div>

          {/* Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: `${statusColor}15`,
              padding: "8px 14px",
              borderRadius: "20px",
              color: statusColor,
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                backgroundColor: statusColor,
              }}
            />

            {vehicle.condition_status
              ? vehicle.condition_status.replace("_", " ")
              : "Unknown"}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          border: "1px solid #e0e0e0",
          padding: "25px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            color: "#2c3e50",
            fontSize: "19px",
          }}
        >
          Vehicle Information
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          <InfoItem label="Vehicle ID" value={vehicle.vehicle_id} />
          <InfoItem
            label="Registration Number"
            value={vehicle.registration_no}
          />
          <InfoItem label="Vehicle Type" value={vehicle.type} />
          <InfoItem label="Brand" value={vehicle.brand} />
          <InfoItem label="Model" value={vehicle.model} />
          <InfoItem label="Manufacturing Year" value={vehicle.year} />
          <InfoItem label="Capacity" value={vehicle.capacity} />
          <InfoItem label="Fuel Type" value={vehicle.fuel_type} />
        </div>
      </div>

      {/* Current Assignment */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          border: "1px solid #e0e0e0",
          padding: "25px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            color: "#2c3e50",
            fontSize: "19px",
          }}
        >
          Current Assignment
        </h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            padding: "15px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              width: "45px",
              height: "45px",
              borderRadius: "50%",
              backgroundColor: "#ecf0f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            👤
          </div>

          <div>
            <div
              style={{
                fontSize: "14px",
                color: "#7f8c8d",
                marginBottom: "3px",
              }}
            >
              Current Driver
            </div>

            <div
              style={{
                fontWeight: "600",
                color: "#2c3e50",
              }}
            >
              {vehicle.driver_name || "Unassigned"}
            </div>
          </div>
        </div>
      </div>

      {/* Service Information */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          border: "1px solid #e0e0e0",
          padding: "25px",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            color: "#2c3e50",
            fontSize: "19px",
          }}
        >
          Service Information
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Dynamically derived last_service_date from the updated backend query */}
          <InfoItem
            label="Last Service Date"
            value={
              vehicle.last_service_date
                ? new Date(vehicle.last_service_date).toLocaleDateString()
                : "Never Serviced"
            }
          />

          <InfoItem
            label="Condition Status"
            value={
              vehicle.condition_status
                ? vehicle.condition_status.replace("_", " ")
                : null
            }
          />

          <InfoItem
            label="Availability Status"
            value={
              vehicle.availability_status
                ? vehicle.availability_status.replace("_", " ")
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}

/* Reusable information field */
function InfoItem({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: "12px",
          color: "#95a5a6",
          textTransform: "uppercase",
          fontWeight: "600",
          marginBottom: "6px",
          letterSpacing: "0.3px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "15px",
          color: "#2c3e50",
          fontWeight: "500",
        }}
      >
        {value !== null && value !== undefined && value !== "" ? value : "—"}
      </div>
    </div>
  );
}

export default VehicleDetails;
