import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigate from "react-router-dom";

// Import pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OwnerDashboard from "./pages/OwnerDashboard";
import DriverPortal from "./pages/DriverPortal";
import ProtectedRoute from "./components/ProtectedRoute";
import DriverDetails from "./pages/DriverDetails";

function App() {
  return (<Router> <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Owner/Admin Dashboard */}
    <Route
      path="/owner-dashboard"
      element={
        <ProtectedRoute allowedRoles={["owner", "admin"]}>
          <OwnerDashboard />
        </ProtectedRoute>
      }
    />

    {/* Dashboard tabs */}
    <Route
      path="/dashboard/*"
      element={
        <ProtectedRoute allowedRoles={["owner", "admin"]}>
          <OwnerDashboard />
        </ProtectedRoute>
      }
    />

    {/* Driver portal */}
    <Route
      path="/driver-portal"
      element={
        <ProtectedRoute allowedRoles={["driver"]}>
          <DriverPortal />
        </ProtectedRoute>
      }
    />

  </Routes>
  </Router>
  );
}

export default App;
