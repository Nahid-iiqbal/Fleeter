import React from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";

import { apiFetch } from "../utils/api";

export default function Navbar({ role }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Failed to notify server of logout:", error);
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
