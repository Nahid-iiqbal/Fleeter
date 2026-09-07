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

function ManagersTable({ managers, managersLoading, error, onRefresh, onManagerClick }) {
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredManagers = managers.filter((manager) =>
    [
      manager.manager_id,
      manager.full_name,
      manager.employee_id,
      manager.phone,
      manager.department,
      manager.username,
      manager.email,
      manager.is_active ? "active" : "inactive",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch),
  );

  return (
    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Manager Management</h2>
        <input
          type="search"
          placeholder="Search managers"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Search managers"
          style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: "5px", flex: 1, margin: "0 16px" }}
        />
        <button
          onClick={onRefresh}
          disabled={managersLoading}
          style={{ padding: "8px 14px", border: "none", borderRadius: "5px", backgroundColor: "#3498db", color: "white", cursor: managersLoading ? "not-allowed" : "pointer" }}
        >
          {managersLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <p style={{ color: "#cc0000" }}>{error}</p>}
      {managersLoading ? (
        <p>Loading managers...</p>
      ) : managers.length === 0 && !error ? (
        <p>No managers found.</p>
      ) : filteredManagers.length === 0 ? (
        <p>No managers match your search.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>ID</th>
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>Employee ID</th>
              <th style={tableHeaderStyle}>Department</th>
              <th style={tableHeaderStyle}>Account</th>
              <th style={tableHeaderStyle}>Phone</th>
              <th style={tableHeaderStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredManagers.map((manager) => (
              <tr key={manager.manager_id}>
                <td style={tableCellStyle}>{manager.manager_id}</td>
                <td style={tableCellStyle}>
                  <button
                    onClick={() => onManagerClick(manager.manager_id)}
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
                    {manager.full_name}
                  </button>
                </td>
                <td style={tableCellStyle}>{manager.employee_id || "Not provided"}</td>
                <td style={tableCellStyle}>{manager.department || "Not provided"}</td>
                <td style={tableCellStyle}>{manager.username || manager.email || "Not linked"}</td>
                <td style={tableCellStyle}>{manager.phone || "Not provided"}</td>
                <td style={tableCellStyle}>{manager.is_active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManagersTable;