import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * Adds a "locate me" button to the map.
 *
 * If a `position` prop ([lat, lng]) is supplied, clicking the button just
 * flies to that already-known position instantly — no new geolocation
 * request is made. Ideal when the parent is already tracking position
 * via watchPosition (e.g. an active driver trip).
 *
 * If no `position` is supplied, it falls back to map.locate(), which
 * triggers a fresh browser geolocation lookup.
 */
const LocateControl = ({ position }) => {
  const map = useMap();
  const positionRef = useRef(position);
  positionRef.current = position;

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

        if (positionRef.current) {
          map.flyTo(positionRef.current, 16);
        } else {
          map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
        }
      });

      return container;
    };

    control.addTo(map);
    return () => control.remove();
  }, [map]);

  return null;
};

export default LocateControl;
