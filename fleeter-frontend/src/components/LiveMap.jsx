import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../utils/api";

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
      button.innerHTML = "🎯";
      Object.assign(button.style, {
        width: "34px",
        height: "34px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        backgroundColor: "white",
        cursor: "pointer",
      });


      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);

      L.DomEvent.on(button, "click", (e) => {
        L.DomEvent.stop(e);
        map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
      });

      return container;
    };

    control.addTo(map);
    return () => control.remove();
  }, [map]);

  return null;
};

const LiveMap = () => {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get("/tracking/live");
        setVehicles(response.data);
      } catch (error) {
        console.error("Failed to fetch live locations:", error);
      }
    };
    fetchLocations();
    const interval = setInterval(fetchLocations, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        height: "600px",
        width: "100%",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <MapContainer
        center={[23.8103, 90.4125]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <LocateControl />

        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.vehicle_id}
            position={[vehicle.latitude, vehicle.longitude]}
          >
            <Popup>
              <strong>{vehicle.registration_no}</strong>
              <br />
              Speed: {vehicle.speed_kmh} km/h
              <br />
              Last Ping: {new Date(vehicle.last_updated).toLocaleTimeString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LiveMap;
