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

function DriversTable({
  drivers,
  driversLoading,
  error,
  onRefresh,
  onDriverClick,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [assigningDriver, setAssigningDriver] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tripLoading, setTripLoading] = useState(false);
  const [tripError, setTripError] = useState("");
  const [tripForm, setTripForm] = useState({
    vehicle_id: "",
    route_id: "",
    route_name: "",
    origin_address: "",
    destination_address: "",
    custom_route: false,
    departure_time: getDefaultDepartureTime(),
    cargo_type: "cargo",
    notes: "",
  });
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

  useEffect(() => {
    if (!assigningDriver) {
      return;
    }

    const loadTripOptions = async () => {
      try {
        setTripLoading(true);
        setTripError("");
        const [routeData, vehicleData] = await Promise.all([
          apiFetch("/api/company/routes"),
          apiFetch("/api/vehicles"),
        ]);
        setRoutes(routeData);
        setVehicles(vehicleData);
        setTripForm((current) => ({
          ...current,
          vehicle_id: current.vehicle_id || String(vehicleData[0]?.vehicle_id || ""),
          route_id: current.route_id || String(routeData[0]?.route_id || ""),
        }));
      } catch (loadError) {
        setTripError(loadError.message || "Unable to load trip options.");
      } finally {
        setTripLoading(false);
      }
    };

    loadTripOptions();
  }, [assigningDriver]);

  const closeAssignment = () => {
    setAssigningDriver(null);
    setTripError("");
  };

  const submitAssignment = async (event) => {
    event.preventDefault();
    try {
      setTripLoading(true);
      setTripError("");
      await apiFetch("/api/company/trips", {
        method: "POST",
        body: JSON.stringify({
          ...tripForm,
          driver_id: assigningDriver.driver_id,
        }),
      });
      closeAssignment();
      onRefresh();
    } catch (submitError) {
      setTripError(submitError.message || "Unable to assign trip.");
    } finally {
      setTripLoading(false);
    }
  };

  const updateTripField = (event) => {
    const { name, value, type, checked } = event.target;
    setTripForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

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
              <th style={tableHeaderStyle}>Actions</th>
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

                <td style={tableCellStyle}>
                  <button
                    type="button"
                    onClick={() => {
                      setTripForm((current) => ({
                        ...current,
                        departure_time: getDefaultDepartureTime(),
                      }));
                      setAssigningDriver(driver);
                    }}
                    style={assignButtonStyle}
                  >
                    Assign trip
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {assigningDriver && (
        <div style={modalBackdropStyle} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeAssignment();
        }}>
          <div style={modalStyle} role="dialog" aria-modal="true" aria-labelledby="assign-trip-title">
            <div style={modalHeaderStyle}>
              <div>
                <h2 id="assign-trip-title" style={{ margin: 0 }}>Assign trip</h2>
                <p style={{ margin: "6px 0 0", color: "#667085" }}>
                  Driver: {assigningDriver.full_name}
                </p>
              </div>
              <button type="button" onClick={closeAssignment} style={closeButtonStyle} aria-label="Close assign trip dialog">
                X
              </button>
            </div>

            {tripError && <div style={formErrorStyle}>{tripError}</div>}
            {tripLoading && routes.length === 0 && vehicles.length === 0 ? (
              <p>Loading trip options...</p>
            ) : (
              <form onSubmit={submitAssignment}>
                <label style={fieldStyle}>
                  Vehicle
                  <select name="vehicle_id" value={tripForm.vehicle_id} onChange={updateTripField} required style={inputStyle}>
                    <option value="">Select a vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                        {vehicle.registration_no} ({vehicle.brand} {vehicle.model})
                      </option>
                    ))}
                  </select>
                </label>

                <label style={fieldStyle}>
                  Existing route
                  <select name="route_id" value={tripForm.route_id} onChange={updateTripField} disabled={tripForm.custom_route} required={!tripForm.custom_route} style={inputStyle}>
                    <option value="">Select a route</option>
                    {routes.map((route) => (
                      <option key={route.route_id} value={route.route_id}>
                        {route.route_name}: {route.origin} to {route.destination}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={checkboxStyle}>
                  <input type="checkbox" name="custom_route" checked={tripForm.custom_route} onChange={updateTripField} />
                  Add custom trip addresses as a route
                </label>

                {tripForm.custom_route && (
                  <>
                    <label style={fieldStyle}>
                      Route name
                      <input name="route_name" value={tripForm.route_name} onChange={updateTripField} required maxLength="100" style={inputStyle} />
                    </label>
                    <div style={twoColumnStyle}>
                      <label style={fieldStyle}>
                        Origin address
                        <input name="origin_address" value={tripForm.origin_address} onChange={updateTripField} required style={inputStyle} />
                      </label>
                      <label style={fieldStyle}>
                        Destination address
                        <input name="destination_address" value={tripForm.destination_address} onChange={updateTripField} required style={inputStyle} />
                      </label>
                    </div>
                  </>
                )}

                <label style={fieldStyle}>
                  Departure time
                  <input type="datetime-local" name="departure_time" value={tripForm.departure_time} onChange={updateTripField} required style={inputStyle} />
                </label>

                <label style={fieldStyle}>
                  Cargo or passengers
                  <select name="cargo_type" value={tripForm.cargo_type} onChange={updateTripField} required style={inputStyle}>
                    <option value="cargo">Cargo</option>
                    <option value="passengers">Passengers</option>
                  </select>
                </label>
                <label style={fieldStyle}>
                  Notes
                  <textarea name="notes" value={tripForm.notes} onChange={updateTripField} rows="3" style={inputStyle} />
                </label>

                <div style={modalActionsStyle}>
                  <button type="button" onClick={closeAssignment} style={secondaryButtonStyle}>Cancel</button>
                  <button type="submit" disabled={tripLoading} style={primaryButtonStyle}>
                    {tripLoading ? "Assigning..." : "Assign trip"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getDefaultDepartureTime() {
  const departure = new Date(Date.now() + 60 * 60 * 1000);
  departure.setMinutes(departure.getMinutes() - departure.getTimezoneOffset());
  return departure.toISOString().slice(0, 16);
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 10px",
  marginTop: "6px",
  border: "1px solid #cbd5e1",
  borderRadius: "5px",
  font: "inherit",
};

const fieldStyle = { display: "block", marginBottom: "14px", color: "#344054", fontSize: "14px", fontWeight: "600" };
const twoColumnStyle = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" };
const checkboxStyle = { display: "flex", gap: "8px", alignItems: "center", margin: "4px 0 16px", color: "#344054", fontSize: "14px" };
const assignButtonStyle = { padding: "7px 10px", border: "none", borderRadius: "5px", backgroundColor: "#16a085", color: "white", cursor: "pointer", whiteSpace: "nowrap" };
const modalBackdropStyle = { position: "fixed", inset: 0, zIndex: 10, backgroundColor: "rgba(15, 23, 42, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" };
const modalStyle = { backgroundColor: "white", borderRadius: "8px", width: "min(620px, 100%)", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.25)" };
const modalHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" };
const closeButtonStyle = { border: "none", background: "transparent", color: "#667085", cursor: "pointer", fontSize: "16px", fontWeight: "700" };
const formErrorStyle = { backgroundColor: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", borderRadius: "5px", padding: "10px", marginBottom: "16px" };
const modalActionsStyle = { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" };
const secondaryButtonStyle = { padding: "9px 14px", border: "1px solid #cbd5e1", borderRadius: "5px", backgroundColor: "white", color: "#344054", cursor: "pointer" };
const primaryButtonStyle = { padding: "9px 14px", border: "none", borderRadius: "5px", backgroundColor: "#16a085", color: "white", cursor: "pointer" };

export default DriversTable;
