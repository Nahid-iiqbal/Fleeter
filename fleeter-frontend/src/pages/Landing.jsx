import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#0f172a",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Header / Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.5rem 4rem",
          background: "#ffffff",
          boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)",
        }}
      >
        <Link to="/" style={{ textDecoration: "none" }}>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: "800",
              letterSpacing: "1px",
              color: "#0284c7",
            }}
          >
            FLEETER
          </div>
        </Link>
        <div>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "0.6rem 1.5rem",
              background: "#0284c7",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          textAlign: "center",
          padding: "6rem 2rem 4rem",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "3.5rem",
            fontWeight: "800",
            lineHeight: "1.15",
            marginBottom: "1.5rem",
          }}
        >
          Real-Time Intelligence for Your Entire Fleet
        </h1>
        <p
          style={{
            fontSize: "1.25rem",
            color: "#64748b",
            marginBottom: "2.5rem",
            lineHeight: "1.6",
          }}
        >
          Monitor live GPS locations, streamline driver telemetry, track
          maintenance schedules, and optimize fuel expenses—all from a single
          central command center.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <button
            onClick={() => navigate("/register")}
            style={{
              padding: "0.85rem 2rem",
              background: "#0284c7",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "700",
              fontSize: "1.1rem",
              cursor: "pointer",
            }}
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section
        style={{ padding: "4rem 2rem", maxWidth: "1100px", margin: "0 auto" }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "2rem",
            marginBottom: "3rem",
          }}
        >
          Why Fleet Owners Choose Fleeter
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "2rem",
              borderRadius: "10px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              border: "1px solid #e2e8f0",
            }}
          >
            <h3
              style={{
                color: "#0284c7",
                marginBottom: "0.75rem",
                fontSize: "1.25rem",
              }}
            >
              📍 Live GPS Tracking
            </h3>
            <p style={{ color: "#64748b", lineHeight: "1.5" }}>
              High-frequency location pings allow real-time route monitoring
              directly on Google Maps.
            </p>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "2rem",
              borderRadius: "10px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              border: "1px solid #e2e8f0",
            }}
          >
            <h3
              style={{
                color: "#0284c7",
                marginBottom: "0.75rem",
                fontSize: "1.25rem",
              }}
            >
              📊 Fuel & Maintenance Analytics
            </h3>
            <p style={{ color: "#64748b", lineHeight: "1.5" }}>
              Track mileage, maintenance logs, and fuel efficiency metrics
              automatically in real time.
            </p>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "2rem",
              borderRadius: "10px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              border: "1px solid #e2e8f0",
            }}
          >
            <h3
              style={{
                color: "#0284c7",
                marginBottom: "0.75rem",
                fontSize: "1.25rem",
              }}
            >
              🔐 Role-Based Portals
            </h3>
            <p style={{ color: "#64748b", lineHeight: "1.5" }}>
              Dedicated, secure dashboards custom-built for fleet owners,
              admins, and active drivers.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "2rem",
          borderTop: "1px solid #e2e8f0",
          background: "#ffffff",
          color: "#94a3b8",
          marginTop: "4rem",
        }}
      >
        © {new Date().getFullYear()} Fleeter Transport Management. All rights
        reserved.
      </footer>
    </div>
  );
}
