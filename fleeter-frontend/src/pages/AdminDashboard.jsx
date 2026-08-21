import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("overview"); // 'overview' or 'users'

  useEffect(() => {
    fetchRoster();
  }, []);

  const fetchRoster = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch("http://localhost:5000/api/admin/roster", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setUsers(await res.json());
      } else if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        navigate("/login");
      }
    } catch (err) {
      console.error("Failed to load users");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- DERIVED METRICS ---
  const totalUsers = users.length;
  const totalOwners = users.filter((u) => u.role === "owner").length;
  const totalDrivers = users.filter((u) => u.role === "driver").length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;

  // --- SEARCH LOGIC ---
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.company_name && u.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={styles.appContainer}>

      {/* ================= LEFT SIDEBAR ================= */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h1 style={styles.sidebarTitle}>Fleeter OS</h1>
          <p style={styles.sidebarSubtitle}>Super Admin Panel</p>
        </div>

        <nav style={styles.navContainer}>
          <div style={styles.navSectionTitle}>Dashboard</div>
          <button
            onClick={() => setCurrentTab("overview")}
            style={tabButtonStyle(currentTab === "overview")}
          >
            📊 System Overview
          </button>

          <div style={styles.navSectionTitle}>Management</div>
          <button
            onClick={() => setCurrentTab("users")}
            style={tabButtonStyle(currentTab === "users")}
          >
            👥 User Roster
          </button>
        </nav>

        <div style={styles.logoutContainer}>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main style={styles.mainContent}>

        {/* OVERVIEW TAB */}
        {currentTab === "overview" && (
          <section>
            <h2 style={styles.pageHeader}>System Overview</h2>

            <div style={styles.metricsGrid}>

              {/* Site State Card */}
              <div style={{ ...styles.metricCard, borderTop: "4px solid #2ecc71" }}>
                <h3 style={styles.metricTitle}>Site State</h3>
                <p style={{ ...styles.metricValue, color: "#2ecc71", fontSize: "24px" }}>
                  🟢 Online & Healthy
                </p>
              </div>

              {/* Total Users Card */}
              <div style={{ ...styles.metricCard, borderTop: "4px solid #3498db" }}>
                <h3 style={styles.metricTitle}>Total Users</h3>
                <p style={styles.metricValue}>{totalUsers}</p>
                <p style={styles.metricSubtitle}>{totalAdmins} Site Admins</p>
              </div>

              {/* Total Owners Card */}
              <div style={{ ...styles.metricCard, borderTop: "4px solid #9b59b6" }}>
                <h3 style={styles.metricTitle}>Registered Companies</h3>
                <p style={styles.metricValue}>{totalOwners}</p>
                <p style={styles.metricSubtitle}>Active Fleet Owners</p>
              </div>

              {/* Total Drivers Card */}
              <div style={{ ...styles.metricCard, borderTop: "4px solid #e67e22" }}>
                <h3 style={styles.metricTitle}>Registered Drivers</h3>
                <p style={styles.metricValue}>{totalDrivers}</p>
                <p style={styles.metricSubtitle}>Across all fleets</p>
              </div>

            </div>
          </section>
        )}

        {/* USERS TAB */}
        {currentTab === "users" && (
          <section style={styles.rosterSection}>
            <div style={styles.rosterHeaderFlex}>
              <h2 style={{ margin: 0, color: "#34495e" }}>
                Universal Roster ({filteredUsers.length})
              </h2>
              <input
                type="text"
                placeholder="Search by username, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#ecf0f1", textAlign: "left" }}>
                  <th style={styles.thStyle}>ID</th>
                  <th style={styles.thStyle}>Username</th>
                  <th style={styles.thStyle}>Email</th>
                  <th style={styles.thStyle}>Role</th>
                  <th style={styles.thStyle}>Association</th>
                  <th style={styles.thStyle}>Status</th>
                  <th style={styles.thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} style={{ borderBottom: "1px solid #ecf0f1" }}>
                    <td style={styles.tdStyle}>{user.user_id}</td>
                    <td style={styles.tdStyle}><strong>{user.username}</strong></td>
                    <td style={styles.tdStyle}>{user.email}</td>
                    <td style={styles.tdStyle}>
                      <span
                        style={{
                          padding: "4px 8px",
                          backgroundColor: user.role === "admin" ? "#e74c3c" : user.role === "owner" ? "#9b59b6" : "#3498db",
                          color: "white",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.tdStyle}>
                      {user.company_name && `🏢 ${user.company_name}`}
                      {user.driver_name && `🚚 Driver: ${user.driver_name}`}
                      {!user.company_name && !user.driver_name && "Unassigned"}
                    </td>
                    <td style={styles.tdStyle}>{user.driver_status || "active"}</td>
                    <td style={styles.tdStyle}>
                      <button style={styles.manageBtn}>Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}

// --- DYNAMIC STYLE HELPERS ---
const tabButtonStyle = (isActive) => ({
  width: "100%",
  textAlign: "left",
  padding: "15px 20px",
  backgroundColor: isActive ? "#34495e" : "transparent",
  color: "white",
  border: "none",
  borderLeft: isActive ? "4px solid #3498db" : "4px solid transparent",
  cursor: "pointer",
  fontSize: "15px",
});

// --- CENTRALIZED STATIC STYLES ---
const styles = {
  appContainer: { display: "flex", height: "100vh", backgroundColor: "#f4f7f6", fontFamily: "sans-serif" },
  mainContent: { flex: 1, padding: "30px", overflowY: "auto" },
  pageHeader: { color: "#2c3e50", marginTop: 0, marginBottom: "30px", borderBottom: "2px solid #ecf0f1", paddingBottom: "10px" },

  // Sidebar
  sidebar: { width: "260px", backgroundColor: "#2c3e50", color: "white", display: "flex", flexDirection: "column" },
  sidebarHeader: { padding: "20px", borderBottom: "1px solid #34495e" },
  sidebarTitle: { margin: 0, fontSize: "22px" },
  sidebarSubtitle: { margin: "5px 0 0 0", fontSize: "14px", color: "#bdc3c7" },
  navContainer: { flex: 1, padding: "20px 0", display: "flex", flexDirection: "column", gap: "10px" },
  navSectionTitle: { padding: "10px 20px 0 20px", fontSize: "12px", color: "#7f8c8d", textTransform: "uppercase", fontWeight: "bold" },
  logoutContainer: { padding: "20px" },
  logoutBtn: { width: "100%", padding: "12px", backgroundColor: "#c0392b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },

  // Metrics Grid
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" },
  metricCard: { backgroundColor: "white", padding: "25px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
  metricTitle: { margin: "0 0 10px 0", fontSize: "16px", color: "#7f8c8d", textTransform: "uppercase" },
  metricValue: { margin: 0, fontSize: "36px", fontWeight: "bold", color: "#2c3e50" },
  metricSubtitle: { margin: "5px 0 0 0", fontSize: "14px", color: "#95a5a6" },

  // Roster Table
  rosterSection: { backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
  rosterHeaderFlex: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  searchInput: { width: "300px", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" },
  thStyle: { padding: "12px 15px", color: "#7f8c8d" },
  tdStyle: { padding: "12px 15px", color: "#2c3e50" },
  manageBtn: { padding: "6px 12px", backgroundColor: "#f39c12", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" },
};

export default AdminDashboard;
