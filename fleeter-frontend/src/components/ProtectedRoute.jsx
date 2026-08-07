import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // 1. If there is no token, bounce them to the login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. If the route requires specific roles, check if the user has permission
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === "driver") {
      return <Navigate to="/driver-portal" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // 3. If they pass the checks, render the requested component
  return children;
}

export default ProtectedRoute;
