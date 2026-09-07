import React, { useState } from "react";

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

function DriversTable({
  drivers,
  driversLoading,
  error,
  onRefresh,
  onDriverClick,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredDrivers = drivers.filter((driver) =>
    [
      driver.driver_id,
      driver.full_name,
      driver.document_no,
      driver.document_type,
      driver.username,
      driver.email,
      driver.phone,
      driver.status,
      driver.joined_date,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch),
  );

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
        <h2 style={{ margin: 0 }}>Driver Management</h2>

        <input
          type="search"
          placeholder="Search drivers"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Search drivers"
          style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: "5px", flex: 1, margin: "0 16px" }}
        />

        <button
          onClick={onRefresh}
          disabled={driversLoading}
          style={{
            padding: "8px 14px",
            border: "none",
            borderRadius: "5px",
            backgroundColor: "#3498db",
            color: "white",
            cursor: driversLoading ? "not-allowed" : "pointer",
          }}
        >
          {driversLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Visible Error Feedback Box */}
      {error && (
        <div
          style={{
            backgroundColor: "#ffe6e6",
            color: "#cc0000",
            border: "1px solid #cc0000",
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "4px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading & Empty States */}
      {driversLoading ? (
        <p>Loading drivers...</p>
      ) : drivers.length === 0 && !error ? (
        <p>No drivers found.</p>
      ) : filteredDrivers.length === 0 ? (
        <p>No drivers match your search.</p>
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
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>License Document</th>
              <th style={tableHeaderStyle}>Account</th>
              <th style={tableHeaderStyle}>Phone</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={tableHeaderStyle}>Joined</th>
            </tr>
          </thead>

          <tbody>
            {filteredDrivers.map((driver) => (
              <tr key={driver.driver_id}>
                <td style={tableCellStyle}>{driver.driver_id}</td>

                <td style={tableCellStyle}>
                  <button
                    onClick={() => onDriverClick(driver.driver_id)}
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
                    {driver.full_name}
                  </button>
                </td>

                <td style={tableCellStyle}>
                  {driver.document_no || "Not provided"}
                  {driver.document_type && (
                    <>
                      <br />
                      <small>
                        Type: {driver.document_type.replaceAll("_", " ")}
                      </small>
                    </>
                  )}
                </td>

                <td style={tableCellStyle}>
                  {driver.username || driver.email || "Not linked"}
                  {driver.email && driver.username && (
                    <>
                      <br />
                      <small>{driver.email}</small>
                    </>
                  )}
                </td>

                <td style={tableCellStyle}>{driver.phone}</td>

                <td style={tableCellStyle}>{driver.status}</td>

                <td style={tableCellStyle}>{driver.joined_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DriversTable;
