import React from "react";

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

function VehiclesTable({
  vehicles,
  vehiclesLoading,
  onRefresh,
  onVehicleClick,
}) {
  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #e0e0e0",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>Fleet Inventory</h2>

        <button
          onClick={onRefresh}
          disabled={vehiclesLoading}
          style={{
            padding: "8px 14px",
            border: "none",
            borderRadius: "5px",
            backgroundColor: "#3498db",
            color: "white",
            cursor: vehiclesLoading ? "not-allowed" : "pointer",
          }}
        >
          {vehiclesLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Loading */}
      {vehiclesLoading ? (
        <p>Loading vehicles...</p>
      ) : vehicles.length === 0 ? (
        <p>No vehicles found.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={tableHeaderStyle}>ID</th>
              <th style={tableHeaderStyle}>Registration</th>
              <th style={tableHeaderStyle}>Vehicle</th>
              <th style={tableHeaderStyle}>Type</th>
              <th style={tableHeaderStyle}>Fuel</th>
              <th style={tableHeaderStyle}>Driver</th>
              <th style={tableHeaderStyle}>Status</th>
            </tr>
          </thead>

          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.vehicle_id}>
                <td style={tableCellStyle}>
                  {vehicle.vehicle_id}
                </td>

                <td style={tableCellStyle}>
                  {vehicle.registration_no}
                </td>

                <td style={tableCellStyle}>
                  <button
                    onClick={() =>
                      onVehicleClick(vehicle.vehicle_id)
                    }
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#3498db",
                      cursor: "pointer",
                      fontSize: "inherit",
                      fontWeight: "600",
                    }}
                  >
                    {vehicle.brand} {vehicle.model}
                    <br />
                    <small>
                      Year: {vehicle.year || "N/A"}
                    </small>
                  </button>
                </td>

                <td style={tableCellStyle}>
                  {vehicle.type}
                </td>

                <td style={tableCellStyle}>
                  {vehicle.fuel_type}
                </td>

                <td style={tableCellStyle}>
                  {vehicle.current_driver_name || "Unassigned"}
                </td>

                <td style={tableCellStyle}>
                  {vehicle.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default VehiclesTable;

