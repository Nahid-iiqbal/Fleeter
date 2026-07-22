import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing'
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import DriverPortal from './pages/DriverPortal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/driver" element={<DriverPortal />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;