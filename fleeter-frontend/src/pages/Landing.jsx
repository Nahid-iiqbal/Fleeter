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
  Avatar,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MapIcon from "@mui/icons-material/Map";
import BarChartIcon from "@mui/icons-material/BarChart";
import LockIcon from "@mui/icons-material/Lock";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useThemeSettings } from "../context/ThemeSettingsContext";

const features = [
  {
    icon: <MapIcon fontSize="medium" />,
    title: "Live GPS Tracking",
    desc: "High-frequency location pings allow real-time route monitoring directly on an interactive map.",
  },
  {
    icon: <BarChartIcon fontSize="medium" />,
    title: "Fleet Analytics",
    desc: "Track mileage, maintenance logs, and fuel efficiency metrics automatically in real time.",
  },
  {
    icon: <LockIcon fontSize="medium" />,
    title: "Role-Based Portals",
    desc: "Dedicated, secure dashboards custom-built for fleet owners, managers, and active drivers.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeSettings();

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", color: "text.primary" }}>
      {/* Glassmorphic Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.default, 0.8),
          backdropFilter: "blur(12px)",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar
          sx={{
            px: { xs: 2, md: 4 },
            height: 80,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          {/* Left Side: Logo & Title */}
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <LocalShippingIcon sx={{ mr: 1.5, color: "primary.main", fontSize: 28 }} />
            <Typography
              variant="h6"
              fontWeight={800}
              letterSpacing={1.5}
              color="text.primary"
              sx={{ fontSize: "1.25rem", m: 0 }}
            >
              FLEETER
            </Typography>
          </Box>

          {/* Right Side: Actions & Buttons */}
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Tooltip title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton onClick={toggleTheme} sx={{ color: "text.secondary" }}>
                {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            <Button
              variant="text"
              color="inherit"
              onClick={() => navigate("/login")}
              sx={{ display: { xs: "none", sm: "inline-flex" }, fontWeight: 600 }}
            >
              Log in
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/register")}
              disableElevation
              sx={{
                borderRadius: "24px",
                px: 3,
                py: 1,
                fontWeight: 700,
                textTransform: "none",
              }}
            >
              Get Started
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section with Soft Glow */}
      <Box
        sx={{
          position: "relative",
          pt: { xs: 10, md: 15 },
          pb: { xs: 8, md: 12 },
          overflow: "hidden",
        }}
      >
        {/* Background Radial Gradient Glow */}
        <Box
          sx={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "80vw",
            height: "80vw",
            maxWidth: 800,
            maxHeight: 800,
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Typography
            variant="h1"
            fontWeight={700}
            lineHeight={1.1}
            mb={3}
            sx={{
              fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.5rem" },
              letterSpacing: "-0.02em",
            }}
          >
            Real-Time Intelligence for Your <Box component="span" color="primary.main">Entire Fleet</Box>
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            mb={10}
            fontWeight={400}
            sx={{ maxWidth: 650, mx: "auto", lineHeight: 1.6, fontSize: { xs: "1.1rem", md: "1.25rem" } }}
          >
            Monitor live GPS locations, streamline driver telemetry, track maintenance schedules, and optimize fuel expenses — all from a single command center.
          </Typography>

          <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/register")}
              endIcon={<ArrowForwardIcon />}
              disableElevation
              sx={{
                borderRadius: "30px",
                px: 4,
                py: 1.5,
                mx: 0.5,
                fontSize: "1rem",
                fontWeight: 700,
                textTransform: "none",
              }}
            >
              Start for Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/login")}
              sx={{
                borderRadius: "30px",
                px: 4,
                py: 1.5,
                mx: 0.5,
                fontSize: "1rem",
                fontWeight: 600,
                textTransform: "none",
                borderColor: "divider",
                color: "text.primary",
                "&:hover": {
                  borderColor: "text.primary",
                  bgcolor: "transparent",
                },
              }}
            >
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Grid */}
      <Box sx={{ py: { xs: 8, md: 14 }, borderTop: 1, borderColor: "divider", bgcolor: mode === 'dark' ? 'background.default' : '#f8fafc' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography variant="body2" color="primary.main" fontWeight={700} letterSpacing={1.5} textTransform="uppercase" mb={1}>
              Platform Features
            </Typography>
            <Typography variant="h3" fontWeight={800} mb={2} sx={{ fontSize: { xs: "2rem", md: "2.75rem" }, letterSpacing: "-0.02em" }}>
              Why Fleet Owners Choose Fleeter
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: "auto", fontSize: "1.1rem" }}>
              Everything you need to run a modern, data-driven fleet operation without the enterprise overhead.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((f) => (
              <Grid item xs={12} md={4} key={f.title}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    p: { xs: 2, md: 3 },
                    borderRadius: 4,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: theme.shadows[10],
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                >
                  <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: "primary.main",
                        width: 56,
                        height: 56,
                        mb: 3,
                        borderRadius: 3,
                      }}
                    >
                      {f.icon}
                    </Avatar>
                    <Typography variant="h5" fontWeight={700} mb={1.5} sx={{ letterSpacing: "-0.01em" }}>
                      {f.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" lineHeight={1.7}>
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
          background: mode === 'dark'
            ? "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)"
            : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
          color: "#fff",
          py: { xs: 8, md: 12 },
          textAlign: "center",
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h3" fontWeight={800} mb={2} sx={{ letterSpacing: "-0.02em" }}>
            Ready to take control?
          </Typography>
          <Typography variant="h6" mb={5} fontWeight={400} sx={{ opacity: 0.9, lineHeight: 1.6 }}>
            Join modern fleet owners who trust Fleeter to keep their operations running efficiently.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/register")}
            disableElevation
            sx={{
              bgcolor: "#fff",
              color: "#0369a1",
              borderRadius: "30px",
              fontWeight: 800,
              fontSize: "1.1rem",
              px: 5,
              py: 1.8,
              textTransform: "none",
              transition: "transform 0.2s ease",
              "&:hover": {
                bgcolor: "#f8fafc",
                transform: "scale(1.02)"
              },
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
          py: 4,
          textAlign: "center",
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          © {new Date().getFullYear()} Fleeter Transport Management. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
