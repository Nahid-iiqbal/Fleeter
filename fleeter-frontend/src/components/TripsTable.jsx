import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

const cellStyle = { padding: "12px", borderBottom: "1px solid #eee" };
const headerStyle = { textAlign: "left", padding: "12px", borderBottom: "2px solid #ddd", color: "#555" };
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "9px 10px", marginTop: "6px", border: "1px solid #cbd5e1", borderRadius: "5px", font: "inherit" };
const fieldStyle = { display: "block", marginBottom: "14px", color: "#344054", fontSize: "14px", fontWeight: "600" };

function defaultDeparture() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function TripsTable({ trips, tripsLoading, drivers, vehicles, onRefresh, onDriverClick, onVehicleClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [form, setForm] = useState({ driver_id: "", vehicle_id: "", route_id: "", route_name: "", custom_route: false, origin_address: "", destination_address: "", departure_time: defaultDeparture(), cargo_type: "cargo", notes: "" });

  useEffect(() => {
    if (!isOpen) return;
    const loadRoutes = async () => {
      try {
        setLoading(true);
        setRoutes(await apiFetch("/api/company/routes"));
      } catch (loadError) {
        setError(loadError.message || "Unable to load routes.");
      } finally {
        setLoading(false);
      }
    };
    loadRoutes();
  }, [isOpen]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const updateResourceSearch = (event, resourceType) => {
    const value = event.target.value;
    const resources = resourceType === "driver" ? drivers : vehicles;
    const selectedResource = resources.find((resource) => {
      const label = resourceType === "driver"
        ? resource.full_name
        : `${resource.registration_no} (${resource.brand} ${resource.model})`;
      return label === value;
    });

    if (resourceType === "driver") setDriverSearch(value);
    else setVehicleSearch(value);

    setForm((current) => ({
      ...current,
      [`${resourceType}_id`]: selectedResource ? selectedResource[`${resourceType}_id`] : "",
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.driver_id || !form.vehicle_id) {
      setError("Select a driver and vehicle from the search results.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await apiFetch("/api/company/trips", { method: "POST", body: JSON.stringify(form) });
      setIsOpen(false);
      onRefresh();
    } catch (submitError) {
      setError(submitError.message || "Unable to add trip.");
    } finally {
      setLoading(false);
    }
  };

  const grouped = {
    in_progress: trips.filter((trip) => trip.status === "in_progress"),
    scheduled: trips.filter((trip) => trip.status === "scheduled"),
    completed: trips.filter((trip) => trip.status === "completed"),
  };

  return (
    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Trip Management</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" onClick={onRefresh} disabled={tripsLoading} style={{ padding: "9px 14px", border: "none", borderRadius: "5px", backgroundColor: "#3498db", color: "white", cursor: tripsLoading ? "not-allowed" : "pointer" }}>
            {tripsLoading ? "Refreshing..." : "Refresh trips"}
          </button>
          <button type="button" onClick={() => { setError(""); setForm((current) => ({ ...current, departure_time: defaultDeparture() })); setIsOpen(true); }} style={{ padding: "9px 14px", border: "none", borderRadius: "5px", backgroundColor: "#16a085", color: "white", cursor: "pointer" }}>Add trip</button>
        </div>
      </div>
      {tripsLoading ? <p>Loading trips...</p> : trips.length === 0 ? <p>No trips found.</p> : (
        ["in_progress", "scheduled", "completed"].map((status) => (
          <section key={status} style={{ marginBottom: "24px" }}>
            <h3 style={{ color: "#2c3e50", textTransform: "capitalize" }}>{status.replace("_", " ")}</h3>
            {grouped[status].length === 0 ? <p style={{ color: "#7f8c8d" }}>No {status.replace("_", " ")} trips.</p> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={headerStyle}>Route</th><th style={headerStyle}>Driver</th><th style={headerStyle}>Vehicle</th><th style={headerStyle}>Cargo type</th><th style={headerStyle}>Departure</th><th style={headerStyle}>Arrival</th></tr></thead>
                <tbody>{grouped[status].map((trip) => <tr key={trip.trip_id}>
                  <td style={cellStyle}>{trip.origin} to {trip.destination}</td>
                  <td style={cellStyle}><button type="button" onClick={() => onDriverClick(trip.driver_id)} style={linkButtonStyle}>{trip.driver_name}</button></td>
                  <td style={cellStyle}><button type="button" onClick={() => onVehicleClick(trip.vehicle_id)} style={linkButtonStyle}>{trip.registration_no}</button></td>
                  <td style={cellStyle}>{trip.cargo_type || "Not specified"}</td>
                  <td style={cellStyle}>{new Date(trip.departure_time).toLocaleString()}</td>
                  <td style={cellStyle}>{trip.arrival_time ? new Date(trip.arrival_time).toLocaleString() : "-"}</td>
                </tr>)}</tbody>
              </table>
            )}
          </section>
        ))
      )}

      {isOpen && <div style={{ position: "fixed", inset: 0, zIndex: 10, backgroundColor: "rgba(15, 23, 42, .45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setIsOpen(false)}>
        <div style={{ backgroundColor: "white", borderRadius: "8px", width: "min(620px, 100%)", maxHeight: "90vh", overflowY: "auto", padding: "24px" }} role="dialog" aria-modal="true" aria-labelledby="add-trip-title">
          <div style={{ display: "flex", justifyContent: "space-between" }}><h2 id="add-trip-title" style={{ marginTop: 0 }}>Add trip</h2><button type="button" onClick={() => setIsOpen(false)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>X</button></div>
          {error && <div style={{ color: "#be123c", backgroundColor: "#fff1f2", padding: "10px", marginBottom: "14px" }}>{error}</div>}
          <form onSubmit={submit}>
            <label style={fieldStyle}>Search drivers<input type="search" value={driverSearch} onChange={(event) => updateResourceSearch(event, "driver")} placeholder="Search by driver name" list="trip-driver-options" required style={inputStyle} /><datalist id="trip-driver-options">{drivers.map((driver) => <option key={driver.driver_id} value={driver.full_name} />)}</datalist></label>
            <label style={fieldStyle}>Search vehicles<input type="search" value={vehicleSearch} onChange={(event) => updateResourceSearch(event, "vehicle")} placeholder="Search by registration, brand, or model" list="trip-vehicle-options" required style={inputStyle} /><datalist id="trip-vehicle-options">{vehicles.map((vehicle) => <option key={vehicle.vehicle_id} value={`${vehicle.registration_no} (${vehicle.brand} ${vehicle.model})`} />)}</datalist></label>
            <label style={fieldStyle}>Existing route<select name="route_id" value={form.route_id} onChange={update} disabled={form.custom_route} required={!form.custom_route} style={inputStyle}><option value="">Select a route</option>{routes.map((route) => <option key={route.route_id} value={route.route_id}>{route.route_name}: {route.origin} to {route.destination}</option>)}</select></label>
            <label style={{ display: "flex", gap: "8px", marginBottom: "14px" }}><input type="checkbox" name="custom_route" checked={form.custom_route} onChange={update} /> Add custom trip addresses as a route</label>
            {form.custom_route && <><label style={fieldStyle}>Route name<input name="route_name" value={form.route_name} onChange={update} required maxLength="100" style={inputStyle} /></label><div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" }}><label style={fieldStyle}>Origin<input name="origin_address" value={form.origin_address} onChange={update} required style={inputStyle} /></label><label style={fieldStyle}>Destination<input name="destination_address" value={form.destination_address} onChange={update} required style={inputStyle} /></label></div></>}
            <label style={fieldStyle}>Departure time<input type="datetime-local" name="departure_time" value={form.departure_time} onChange={update} required style={inputStyle} /></label>
            <label style={fieldStyle}>Cargo or passengers<select name="cargo_type" value={form.cargo_type} onChange={update} required style={inputStyle}><option value="cargo">Cargo</option><option value="passengers">Passengers</option></select></label>
            <label style={fieldStyle}>Notes<textarea name="notes" value={form.notes} onChange={update} rows="3" style={inputStyle} /></label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}><button type="button" onClick={() => setIsOpen(false)}>Cancel</button><button type="submit" disabled={loading}>{loading ? "Adding..." : "Add trip"}</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
}

const linkButtonStyle = { padding: 0, border: "none", background: "none", color: "#3498db", cursor: "pointer", font: "inherit", fontWeight: "600" };

export default TripsTable;
