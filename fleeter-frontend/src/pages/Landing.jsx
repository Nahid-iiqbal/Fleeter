import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Link,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import MapIcon from "@mui/icons-material/Map";
import BarChartIcon from "@mui/icons-material/BarChart";
import LockIcon from "@mui/icons-material/Lock";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SpeedIcon from "@mui/icons-material/Speed";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { useThemeSettings } from "../context/ThemeSettingsContext";

const features = [
  {
    icon: <MapIcon fontSize="medium" />,
    title: "Live GPS Tracking",
    desc: "High-frequency location pings allow real-time route monitoring directly on an interactive map.",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.2)",
  },
  {
    icon: <BarChartIcon fontSize="medium" />,
    title: "Fleet Analytics",
    desc: "Track mileage, maintenance logs, and fuel efficiency metrics automatically in real time.",
    color: "#10b981",
    glow: "rgba(16,185,129,0.2)",
  },
  {
    icon: <LockIcon fontSize="medium" />,
    title: "Role-Based Portals",
    desc: "Dedicated, secure dashboards custom-built for fleet owners, managers, and active drivers.",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.2)",
  },
  {
    icon: <SpeedIcon fontSize="medium" />,
    title: "Performance Metrics",
    desc: "Gain instant visibility into driver performance, vehicle utilization, and trip efficiency scores.",
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.2)",
  },
  {
    icon: <NotificationsActiveIcon fontSize="medium" />,
    title: "Smart Alerts",
    desc: "Proactive alerts for document expirations, maintenance deadlines, and unusual driving behavior.",
    color: "#f87171",
    glow: "rgba(248,113,113,0.2)",
  },
];

const stats = [
  { value: "10+", label: "Vehicles Managed" },
  { value: "< 0.9%", label: "Uptime SLA (hamara marzi)" },
  { value: "< 3s", label: "GPS Refresh Rate" },
  { value: "inf★", label: "Operator Rating" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeSettings();
  const isDark = mode === "dark";

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        color: "text.primary",
        overflowX: "hidden",
      }}
    >
      {/* ─── Navbar ─── */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: isDark ? "rgba(10,22,40,0.8)" : "rgba(255,255,255,0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar
          sx={{
            px: { xs: 2, md: 6 },
            height: 72,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Link
              component={RouterLink}
              to="/"
              underline="none"
              sx={{ display: "inline-block" }}
            >
              <Typography
                variant="h4"
                fontWeight={1000}
                letterSpacing={2}
                sx={{
                  fontFamily: '"Passero One", cursive',
                  background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  cursor: "pointer",
                }}
              >
                FLEETER
              </Typography>
            </Link>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={isDark ? "Light Mode" : "Dark Mode"}>
              <IconButton
                onClick={toggleTheme}
                size="small"
                sx={{
                  color: "text.secondary",
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(0,0,0,0.04)",
                  borderRadius: 2,
                }}
              >
                {isDark ? (
                  <LightModeIcon fontSize="small" />
                ) : (
                  <DarkModeIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Button
              variant="text"
              onClick={() => navigate("/login")}
              sx={{
                display: { xs: "none", sm: "flex" },
                color: "text.secondary",
                fontWeight: 600,
              }}
            >
              Log in
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate("/register")}
              sx={{ borderRadius: "24px", px: 2.5, py: 0.8, fontWeight: 700 }}
            >
              Get Started
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ─── Hero ─── */}
      <Box
        sx={{
          position: "relative",
          pt: { xs: 8, md: 10 },
          pb: { xs: 6, md: 8 },
          overflow: "hidden",
        }}
      >
        {/* Ambient glows */}
        <Box
          sx={{
            position: "absolute",
            top: -100,
            left: "20%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
            filter: "blur(40px)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -50,
            right: "10%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
            filter: "blur(40px)",
          }}
        />

        {/* Subtle grid pattern */}
        {isDark && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              opacity: 0.03,
              pointerEvents: "none",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        )}

        <Container
          maxWidth="md"
          sx={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Chip
            label="Fleet Management Reimagined"
            sx={{
              mb: 4,
              fontWeight: 700,
              fontSize: "0.8rem",
              letterSpacing: "0.03em",
              bgcolor: isDark ? "rgba(59,130,246,0.12)" : "#dbeafe",
              color: isDark ? "#60a5fa" : "#1d4ed8",
              border: isDark
                ? "1px solid rgba(59,130,246,0.25)"
                : "1px solid #bfdbfe",
              px: 1,
            }}
          />

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2rem", sm: "2.8rem", md: "3.2rem" },
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              mb: 2,
            }}
          >
            Real-Time Intelligence{" "}
            <Box
              component="span"
              sx={{
                background:
                  "linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #34d399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline",
              }}
            >
              for Your Fleet
            </Box>
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: 620,
              mb: 4,
              lineHeight: 1.7,
              fontWeight: 400,
              fontSize: { xs: "0.9rem", md: "1rem" },
            }}
          >
            Monitor live GPS locations, streamline driver telemetry, track
            maintenance schedules, and optimize fuel expenses — all from a
            single command center.
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
              width: "100%",
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/register")}
              endIcon={<ArrowForwardIcon />}
              sx={{
                borderRadius: "30px",
                px: 3.5,
                py: 1.2,
                fontSize: "0.95rem",
                fontWeight: 700,
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
                px: 3.5,
                py: 1.2,
                fontSize: "0.95rem",
                fontWeight: 600,
                borderColor: isDark ? "#1a2d4a" : "#e2e8f0",
                color: "text.primary",
                "&:hover": {
                  borderColor: "#3b82f6",
                  bgcolor: "rgba(59,130,246,0.06)",
                },
              }}
            >
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ─── Stats Bar ─── */}
      <Box
        sx={{
          py: 4,
          borderTop: "1px solid",
          borderBottom: "1px solid",
          borderColor: "divider",
          background: isDark
            ? "linear-gradient(90deg, rgba(59,130,246,0.04) 0%, rgba(16,185,129,0.04) 100%)"
            : "linear-gradient(90deg, #f0f7ff 0%, #f0fdf4 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 3,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {stats.map((s) => (
              <Box key={s.label} sx={{ textAlign: "center" }}>
                <Typography
                  variant="h3"
                  fontWeight={900}
                  sx={{
                    background: "linear-gradient(135deg, #3b82f6, #34d399)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontSize: { xs: "1.5rem", md: "2rem" },
                  }}
                >
                  {s.value}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={600}
                  sx={{ mt: 0.5 }}
                >
                  {s.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─── Features Grid ─── */}
      <Box sx={{ py: { xs: 8, md: 10 }, width: "100%" }}>
        <Container maxWidth="lg">
          {/* Centered Heading */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              mb: 6,
              mx: "auto",
              maxWidth: 700,
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: "primary.light",
                fontWeight: 700,
                letterSpacing: "0.15em",
                display: "block",
              }}
            >
              PLATFORM FEATURES
            </Typography>
            <Typography
              variant="h2"
              fontWeight={900}
              mt={1}
              mb={2}
              sx={{
                fontSize: { xs: "1.75rem", md: "2.4rem" },
                letterSpacing: "-0.02em",
              }}
            >
              Why Fleet Owners Choose Fleeter
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: "0.95rem", lineHeight: 1.7 }}
            >
              Everything you need to run a modern, data-driven fleet operation
              without the enterprise overhead.
            </Typography>
          </Box>

          {/* Equal-height 3-column CSS Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 3,
              alignItems: "stretch",
            }}
          >
            {features.map((f) => (
              <Box
                key={f.title}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  p: 3.5,
                  borderRadius: 3,
                  background: isDark
                    ? "linear-gradient(135deg, rgba(15,25,41,0.9) 0%, rgba(10,22,40,0.95) 100%)"
                    : "#ffffff",
                  border: "1px solid",
                  borderColor: isDark ? "#1a2d4a" : "#e2e8f0",
                  transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                  cursor: "default",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    borderColor: f.color,
                    boxShadow: `0 20px 60px ${f.glow}`,
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2.5,
                    mb: 2.5,
                    background: `linear-gradient(135deg, ${f.glow}, ${alpha(f.color, 0.15)})`,
                    border: `1px solid ${alpha(f.color, 0.3)}`,
                    color: f.color,
                  }}
                >
                  {f.icon}
                </Avatar>
                <Typography variant="h6" fontWeight={700} mb={1}>
                  {f.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  lineHeight={1.6}
                  sx={{ flexGrow: 1 }}
                >
                  {f.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─── CTA Banner ─── */}
      <Box
        sx={{
          position: "relative",
          py: { xs: 8, md: 10 },
          textAlign: "center",
          overflow: "hidden",
          background: isDark
            ? "linear-gradient(135deg, #0d1f3c 0%, #0a1628 50%, #0d2040 100%)"
            : "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)",
          borderTop: "1px solid",
          borderColor: isDark ? "#1a2d4a" : "transparent",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "10%",
            left: "5%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "10%",
            right: "5%",
            width: 250,
            height: 250,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
        <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h2"
            fontWeight={900}
            sx={{
              color: "#fff",
              fontSize: { xs: "1.6rem", md: "2.2rem" },
              letterSpacing: "-0.02em",
              mb: 2,
            }}
          >
            Ready to take control?
          </Typography>
          <Typography
            variant="h6"
            fontWeight={400}
            sx={{
              opacity: 0.75,
              color: "#fff",
              lineHeight: 1.7,
              fontSize: { xs: "0.95rem", md: "1.05rem" },
              mb: 3,
            }}
          >
            Join modern fleet owners who trust Fleeter to keep their operations
            running efficiently.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/register")}
            sx={{
              borderRadius: "30px",
              fontWeight: 800,
              fontSize: "0.95rem",
              px: 4,
              py: 1.3,
              bgcolor: "#fff",
              color: "#1d4ed8",
              boxShadow: "0 8px 30px rgba(255,255,255,0.2)",
              "&:hover": {
                bgcolor: "#f0f7ff",
                transform: "scale(1.03)",
                boxShadow: "0 12px 40px rgba(255,255,255,0.3)",
              },
            }}
          >
            Create Your Account
          </Button>
        </Container>
      </Box>

      {/* ─── Footer ─── */}
      <Box
        component="footer"
        sx={{
          py: 4,
          textAlign: "center",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mb: 1,
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              fontFamily: '"Passero One", cursive',
              background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            FLEETER
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Fleeter Transport Management. All rights
          reserved.
        </Typography>
      </Box>
    </Box>
  );
}
