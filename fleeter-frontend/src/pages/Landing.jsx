import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MapIcon from "@mui/icons-material/Map";
import BarChartIcon from "@mui/icons-material/BarChart";
import LockIcon from "@mui/icons-material/Lock";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useThemeSettings } from "../context/ThemeSettingsContext";

const features = [
  {
    icon: <MapIcon fontSize="large" color="primary" />,
    title: "Live GPS Tracking",
    desc: "High-frequency location pings allow real-time route monitoring directly on an interactive map.",
  },
  {
    icon: <BarChartIcon fontSize="large" color="primary" />,
    title: "Fuel & Maintenance Analytics",
    desc: "Track mileage, maintenance logs, and fuel efficiency metrics automatically in real time.",
  },
  {
    icon: <LockIcon fontSize="large" color="primary" />,
    title: "Role-Based Portals",
    desc: "Dedicated, secure dashboards custom-built for fleet owners, managers, and active drivers.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeSettings();

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", color: "text.primary" }}>
      {/* Navbar */}
      <AppBar position="sticky" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, md: 6 } }}>
          <LocalShippingIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography
            variant="h6"
            fontWeight={800}
            letterSpacing={1}
            color="primary.main"
            sx={{ flexGrow: 1, fontSize: "1.4rem" }}
          >
            FLEETER
          </Typography>
          <Tooltip title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <IconButton onClick={toggleTheme} sx={{ mr: 1 }}>
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate("/login")}
            sx={{ mr: 1 }}
          >
            Sign In
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/register")}
          >
            Get Started
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Container maxWidth="md" sx={{ textAlign: "center", py: { xs: 8, md: 12 } }}>
        <Typography
          variant="h2"
          fontWeight={800}
          lineHeight={1.15}
          mb={3}
          sx={{ fontSize: { xs: "2.2rem", md: "3.2rem" } }}
        >
          Real-Time Intelligence for Your Entire Fleet
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          mb={5}
          fontWeight={400}
          sx={{ maxWidth: 620, mx: "auto", lineHeight: 1.7 }}
        >
          Monitor live GPS locations, streamline driver telemetry, track maintenance
          schedules, and optimize fuel expenses — all from a single command center.
        </Typography>
        <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/register")}
            sx={{ px: 4, py: 1.5, fontSize: "1rem" }}
          >
            Start for Free
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/login")}
            sx={{ px: 4, py: 1.5, fontSize: "1rem" }}
          >
            Sign In
          </Button>
        </Box>
      </Container>

      {/* Features */}
      <Box sx={{ bgcolor: "background.paper", py: { xs: 6, md: 10 }, borderTop: 1, borderColor: "divider" }}>
        <Container maxWidth="lg">
          <Typography variant="h4" textAlign="center" fontWeight={700} mb={2}>
            Why Fleet Owners Choose Fleeter
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            mb={6}
            sx={{ maxWidth: 500, mx: "auto" }}
          >
            Everything you need to run a modern, data-driven fleet operation.
          </Typography>
          <Grid container spacing={4}>
            {features.map((f) => (
              <Grid item xs={12} md={4} key={f.title}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    p: 2,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent>
                    <Box mb={2}>{f.icon}</Box>
                    <Typography variant="h6" fontWeight={700} mb={1}>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                      {f.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Banner */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
          color: "#fff",
          py: { xs: 6, md: 8 },
          textAlign: "center",
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h4" fontWeight={700} mb={2}>
            Ready to take control of your fleet?
          </Typography>
          <Typography variant="body1" mb={4} sx={{ opacity: 0.9 }}>
            Join fleet owners who trust Fleeter to keep their operations running smoothly.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/register")}
            sx={{
              bgcolor: "#fff",
              color: "#0284c7",
              fontWeight: 700,
              px: 5,
              "&:hover": { bgcolor: "#f0f9ff" },
            }}
          >
            Create Your Account
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          textAlign: "center",
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Fleeter Transport Management. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
