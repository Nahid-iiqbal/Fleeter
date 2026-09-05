import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

function CompanyRequests({ joinOnly = false, showJoinRequest = true }) {
  const role = localStorage.getItem("role");
  const [companies, setCompanies] = useState([]);
  const [mine, setMine] = useState([]);
  const [pending, setPending] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [availableCompanies, ownRequests, pendingRequests] = await Promise.all([
        role === "manager" || role === "driver"
          ? apiFetch("/api/company/companies")
          : Promise.resolve([]),
        role === "manager" || role === "driver"
          ? apiFetch("/api/company/requests/mine")
          : Promise.resolve([]),
        role === "owner" || role === "manager"
          ? apiFetch("/api/company/requests/pending")
          : Promise.resolve([]),
      ]);
      setCompanies(availableCompanies);
      setMine(ownRequests);
      setPending(pendingRequests);
    } catch (requestError) {
      setError(requestError.message || "Unable to load company requests.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const pendingRequest = mine.find((request) => request.status === "pending");
  const requestLocked = Boolean(pendingRequest);

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!selectedCompany || requestLocked) return;

    try {
      await apiFetch("/api/company/requests", {
        method: "POST",
        body: JSON.stringify({ owner_id: selectedCompany, message }),
      });
      setSelectedCompany("");
      setMessage("");
      await loadRequests();
    } catch (requestError) {
      setError(requestError.message || "Unable to send request.");
    }
  };

  const cancelRequest = async (requestId) => {
    try {
      await apiFetch(`/api/company/requests/${requestId}`, { method: "DELETE" });
      await loadRequests();
    } catch (requestError) {
      setError(requestError.message || "Unable to cancel request.");
    }
  };

  const decide = async (requestId, decision) => {
    try {
      await apiFetch(`/api/company/requests/${requestId}/${decision}`, {
        method: "POST",
      });
      await loadRequests();
    } catch (requestError) {
      setError(requestError.message || "Unable to update request.");
    }
  };

  if (loading) return <p>Loading company requests...</p>;

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      {showJoinRequest && (role === "manager" || role === "driver") && (
        <section style={sectionStyle}>
          <div style={requestPanelStyle}>
            <div style={joinHeaderStyle}>
              <div>
                <h2 style={{ margin: 0 }}>Make a request</h2>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>Send one request and wait for the company&apos;s response.</p>
              </div>
              <span style={requestLocked ? lockedBadgeStyle : openBadgeStyle}>{requestLocked ? "Request pending" : "Ready to request"}</span>
            </div>
            {requestLocked && (
              <div style={pendingNoticeStyle}>
                <strong>Your request is under review.</strong>
                <span>You can request another company after cancelling the pending request below.</span>
              </div>
            )}
            <form onSubmit={submitRequest} style={{ display: "grid", gap: "14px" }}>
              <select value={selectedCompany} onChange={(event) => setSelectedCompany(event.target.value)} disabled={requestLocked} required>
                <option value="">Choose a company</option>
                {companies.map((company) => (
                  <option key={company.owner_id} value={company.owner_id}>
                    {company.company_name || `Company ${company.owner_id}`}
                  </option>
                ))}
              </select>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message (optional)" rows="3" />
              <button type="submit" style={{ ...buttonStyle, opacity: selectedCompany && !requestLocked ? 1 : 0.55 }} disabled={!selectedCompany || requestLocked}>Send request</button>
            </form>
          </div>
          <div style={requestPanelStyle}>
            <div style={requestsHeaderStyle}>
              <div>
                <h2 style={{ margin: 0 }}>Your requests</h2>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>Track invitations across every company.</p>
              </div>
              <div style={headerActionsStyle}>
                {mine.length > 0 && <span style={countStyle}>{mine.length}</span>}
                <button type="button" onClick={() => window.location.reload()} style={refreshButtonStyle}>
                  Refresh
                </button>
              </div>
            </div>
            <RequestList requests={mine} empty="No requests sent yet." onCancel={cancelRequest} />
          </div>
        </section>
      )}

      {!joinOnly && (role === "owner" || role === "manager") && (
        <section style={sectionStyle}>
          <h2>Pending Requests</h2>
          {role === "manager" && <p>Managers can approve driver requests only.</p>}
          {pending.map((request) => (
            <div key={request.request_id} style={pendingRequestStyle}>
              <div style={requestIdentityStyle}>
                <Avatar name={request.full_name || request.username} image={request.profile_image} />
                <div style={{ minWidth: 0 }}>
                  <strong style={requestNameStyle}>{request.full_name || request.username}</strong>
                  <span style={roleLabelStyle}>{request.requested_role}</span>
                  <div style={mutedTextStyle}>{request.email}</div>
                  {(request.phone || request.employee_id || request.department) && (
                    <div style={mutedTextStyle}>
                      {[request.phone, request.employee_id && `ID ${request.employee_id}`, request.department].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              </div>
              <div style={requestDetailsStyle}>
                <div style={requestMetaStyle}>Sent {formatDateTime(request.created_at)}</div>
                {request.message && <div style={noteStyle}><strong>Note</strong><span>{request.message}</span></div>}
              </div>
              <div style={requestActionsStyle}>
                <button onClick={() => decide(request.request_id, "approve")} style={buttonStyle}>Approve</button>
                <button onClick={() => decide(request.request_id, "reject")} style={rejectButtonStyle}>Reject</button>
              </div>
            </div>
          ))}
          {pending.length === 0 && <p>No pending requests.</p>}
        </section>
      )}
    </div>
  );
}

function RequestList({ requests, empty, onCancel }) {
  if (requests.length === 0) return <p>{empty}</p>;
  return requests.map((request) => (
    <div key={request.request_id} style={historyRequestStyle}>
      <div style={requestIdentityStyle}>
        <Avatar name={request.company_name} image={request.company_profile_image} />
        <div style={{ minWidth: 0 }}>
          <strong style={requestNameStyle}>{request.company_name || "Company"}</strong>
          <div style={mutedTextStyle}>{request.owner_username ? `Owner: ${request.owner_username}` : "Company details unavailable"}</div>
          {request.owner_email && <div style={mutedTextStyle}>{request.owner_email}</div>}
        </div>
      </div>
      <div style={requestDetailsStyle}>
        <div style={requestMetaStyle}>Sent {formatDateTime(request.created_at)}</div>
        {request.message && <div style={noteStyle}><strong>Note</strong><span>{request.message}</span></div>}
      </div>
      <div style={requestActionsStyle}>
        <span style={statusStyle(request.status)}>{request.status}</span>
        {request.status === "pending" && <button type="button" onClick={() => onCancel(request.request_id)} style={cancelButtonStyle}>Cancel</button>}
      </div>
    </div>
  ));
}

function formatDateTime(value) {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function Avatar({ name, image }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  return image ? <img src={image} alt="" style={avatarStyle} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div style={avatarStyle}>{initials}</div>;
}

const sectionStyle = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
};

const requestPanelStyle = {
  padding: "18px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  backgroundColor: "#f8fafc",
};

const requestStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "center",
  padding: "14px 0",
  borderBottom: "1px solid #e2e8f0",
};

const historyRequestStyle = { ...requestStyle, display: "grid", gridTemplateColumns: "minmax(180px, 1.2fr) minmax(180px, 1fr) auto", alignItems: "center", gap: "18px" };
const pendingRequestStyle = { ...historyRequestStyle, padding: "18px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#fff", boxShadow: "0 3px 12px rgba(15, 23, 42, 0.05)" };
const requestIdentityStyle = { display: "flex", alignItems: "center", gap: "12px", minWidth: 0 };
const avatarStyle = { width: "46px", height: "46px", flex: "0 0 46px", display: "grid", placeItems: "center", borderRadius: "50%", objectFit: "cover", backgroundColor: "#dbeafe", color: "#1d4ed8", fontWeight: 800, fontSize: "15px" };
const requestNameStyle = { display: "inline-block", color: "#0f172a", fontSize: "15px", marginRight: "8px" };
const roleLabelStyle = { padding: "3px 7px", borderRadius: "999px", backgroundColor: "#eff6ff", color: "#1d4ed8", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" };
const mutedTextStyle = { overflow: "hidden", textOverflow: "ellipsis", color: "#64748b", fontSize: "13px", marginTop: "3px" };
const requestDetailsStyle = { display: "grid", gap: "7px", minWidth: 0 };
const requestMetaStyle = { color: "#475569", fontSize: "13px", fontWeight: 600 };
const noteStyle = { display: "grid", gap: "2px", padding: "8px 10px", borderRadius: "5px", backgroundColor: "#f8fafc", color: "#475569", fontSize: "13px", overflowWrap: "anywhere" };
const requestActionsStyle = { display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: "8px" };

const joinHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "18px" };
const pendingNoticeStyle = { display: "grid", gap: "4px", padding: "14px 16px", marginBottom: "16px", borderLeft: "4px solid #f59e0b", borderRadius: "6px", backgroundColor: "#fffbeb", color: "#92400e" };
const openBadgeStyle = { padding: "6px 10px", borderRadius: "999px", backgroundColor: "#dcfce7", color: "#166534", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" };
const lockedBadgeStyle = { ...openBadgeStyle, backgroundColor: "#fef3c7", color: "#92400e" };
const requestsHeaderStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" };
const headerActionsStyle = { display: "flex", alignItems: "center", gap: "10px" };
const countStyle = { display: "grid", placeItems: "center", minWidth: "28px", height: "28px", borderRadius: "999px", backgroundColor: "#e0edff", color: "#1d4ed8", fontWeight: 700 };
const statusStyle = (status) => ({ padding: "5px 9px", borderRadius: "999px", backgroundColor: status === "approved" ? "#dcfce7" : status === "rejected" ? "#fee2e2" : "#fef3c7", color: status === "approved" ? "#166534" : status === "rejected" ? "#991b1b" : "#92400e", fontSize: "12px", fontWeight: 700, textTransform: "capitalize" });
const cancelButtonStyle = { padding: "6px 9px", border: "1px solid #cbd5e1", borderRadius: "4px", backgroundColor: "white", color: "#475569", cursor: "pointer" };
const refreshButtonStyle = { padding: "8px 14px", border: "none", borderRadius: "5px", backgroundColor: "#3498db", color: "white", cursor: "pointer", fontWeight: 600 };

const buttonStyle = {
  padding: "8px 12px",
  border: "none",
  borderRadius: "4px",
  backgroundColor: "#2e86de",
  color: "white",
  cursor: "pointer",
};

const rejectButtonStyle = { ...buttonStyle, backgroundColor: "#c0392b" };

export default CompanyRequests;
