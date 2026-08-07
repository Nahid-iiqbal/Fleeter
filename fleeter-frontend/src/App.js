import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import your pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OwnerDashboard from "./pages/OwnerDashboard";
import DriverPortal from "./pages/DriverPortal";

// Import the new wrapper
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes - Anyone can access these */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes - Locked behind authentication and roles */}
        <Route
          path="/owner-dashboard"
          element={
            <ProtectedRoute allowedRoles={["owner", "admin"]}>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

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
