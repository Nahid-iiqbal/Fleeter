import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';

export default function DriverPortal() {
  const [status, setStatus] = useState('');

  const sendPing = async () => {
    try {
      const token = localStorage.getItem('token');
      // Simulated GPS coordinates
      await axios.post(
        `${process.env.REACT_APP_API_URL}/tracking/ping`,
        { vehicle_id: 1, latitude: 23.7276, longitude: 90.3929, speed_kmh: 45.5 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus('Location Ping Transmitted Successfully!');
    } catch (err) {
      setStatus('Failed to transmit location');
    }
  };

  return (
    <div>
      <Navbar role="driver" />
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Driver Live GPS Duty Console</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Press the button below to emit live telemetry coordinates to Fleeter central control.</p>
        <button onClick={sendPing} style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Emit GPS Ping
        </button>
        {status && <p style={{ marginTop: '1.5rem', fontWeight: 'bold' }}>{status}</p>}
      </div>
    </div>
  );
}