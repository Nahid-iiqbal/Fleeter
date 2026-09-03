import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";


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
