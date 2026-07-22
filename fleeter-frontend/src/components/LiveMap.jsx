import React, { useEffect, useState } from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import axios from 'axios';

export default function LiveMap() {
  const [vehicles, setVehicles] = useState([]);

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/tracking/live`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicles(res.data);
    } catch (err) {
      console.error('Failed to fetch live vehicle locations', err);
    }
  };

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 10000); // Polling every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}>
      <Map
        style={{ width: '100%', height: 'calc(100vh - 80px)' }}
        defaultCenter={{ lat: 23.7276, lng: 90.3929 }} // Default view (Dhaka)
        defaultZoom={12}
      >
        {vehicles.map((v) => (
          <Marker
            key={v.vehicle_id}
            position={{ lat: parseFloat(v.latitude), lng: parseFloat(v.longitude) }}
            title={`${v.registration_no} -${v.speed_kmh} km/h`}
          />
        ))}
      </Map>
    </APIProvider>
  );
}