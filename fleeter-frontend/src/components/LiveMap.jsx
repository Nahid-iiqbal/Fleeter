import React, { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { apiFetch } from "../utils/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const LocateControl = () => {
  const map = useMap();

  useEffect(() => {
    const control = L.control({ position: "topright" });
    control.onAdd = () => {
      const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      const button = L.DomUtil.create("a", "", container);
      button.href = "#";
      button.title = "Show my location";
      button.innerHTML = "Locate";
      Object.assign(button.style, {
        width: "54px",
        height: "34px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
        cursor: "pointer",
      });
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      L.DomEvent.on(button, "click", (event) => {
        L.DomEvent.stop(event);
        map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
      });
      return container;
    };

    control.addTo(map);
    return () => control.remove();
  }, [map]);

  return null;
};

function LiveMap() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await apiFetch("/api/tracking/fleet");
        setVehicles(data);
      } catch (error) {
        console.error("Failed to fetch live locations:", error);
      }
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: "600px", width: "100%", borderRadius: "8px", overflow: "hidden" }}>
      <MapContainer center={[23.8103, 90.4125]} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocateControl />
        {vehicles.map((vehicle) => (
          <Marker key={vehicle.vehicle_id} position={[vehicle.latitude, vehicle.longitude]}>
            <Popup>
              <strong>{vehicle.registration_no}</strong>
              {vehicle.driver_name && <><br />Driver: {vehicle.driver_name}</>}
              <br />
              Speed: {vehicle.speed_kmh} km/h
              <br />
              Last Ping: {new Date(vehicle.ping_time).toLocaleTimeString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default LiveMap;
