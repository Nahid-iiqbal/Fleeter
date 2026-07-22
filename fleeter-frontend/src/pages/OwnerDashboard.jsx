import React from 'react';
import Navbar from '../components/Navbar';
import LiveMap from '../components/LiveMap';

export default function OwnerDashboard() {
  return (
    <div>
      <Navbar role="owner" />
      <LiveMap />
    </div>
  );
}