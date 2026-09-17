import React from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";

export default function Navbar({ role }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem("token");

    // 1. Genuinely invalidate the token on the server-side
    if (token) {
      try {
        await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Failed to notify server of logout:", error);
      }
    }

    // 2. Clear all frontend state
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");

    // 3. Redirect to login
    navigate("/login");
  };

  return (
    <AppBar position="static" color="secondary">
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography component="span" variant="h6" fontWeight="bold" letterSpacing={1}>
            FLEETER
          </Typography>
          <Typography component="span" variant="caption" color="info.light" sx={{ ml: 1 }}>
            | {role?.toUpperCase()} PORTAL
          </Typography>
        </Box>
        <Button variant="contained" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}
