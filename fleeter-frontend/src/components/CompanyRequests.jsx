import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

function CompanyRequests({ joinOnly = false, showJoinRequest = true, requiresDocuments }) {
  const role = localStorage.getItem("role");
  const documentVerificationRequired = requiresDocuments ?? role === "driver";
  const [companies, setCompanies] = useState([]);
  const [mine, setMine] = useState([]);
  const [pending, setPending] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [licenseComplete, setLicenseComplete] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [availableCompanies, ownRequests, pendingRequests, driverDocuments] = await Promise.all([
        role === "manager" || role === "driver"
          ? apiFetch("/api/company/companies")
          : Promise.resolve([]),
        role === "manager" || role === "driver"
          ? apiFetch("/api/company/requests/mine")
          : Promise.resolve([]),
        role === "owner" || role === "manager"
          ? apiFetch("/api/company/requests/pending")
          : Promise.resolve([]),
        documentVerificationRequired ? apiFetch("/api/driver/documents") : Promise.resolve([]),
      ]);
      setCompanies(availableCompanies);
      setMine(ownRequests);
      setPending(pendingRequests);
      setLicenseComplete(
        !documentVerificationRequired || driverDocuments.some(
          (document) => document.document_type === "driving_license"
            && document.document_no
            && document.issue_date
            && document.expiry_date,
        ),
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to load company requests.");
    } finally {
      setLoading(false);
    }
  }, [documentVerificationRequired, role]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const activeRequest = mine.find((request) => ["pending", "approved"].includes(request.status));
  const hasOnlyRejectedRequests = mine.every((request) => request.status === "rejected");
  const canRequest = licenseComplete && hasOnlyRejectedRequests && !activeRequest;

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!selectedCompany || !canRequest) return;

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
        <section style={requestStepSectionStyle}>
          <div style={{ ...requestStepCardStyle, opacity: canRequest ? 1 : 0.72 }}>
            <div style={requestIntroStyle}>
              <div style={requestProgressStyle}>
                {documentVerificationRequired && <div style={{ ...requestProgressStepStyle, borderColor: "#16a34a", color: "#16a34a" }}>1. Name entered</div>}
                {documentVerificationRequired && <div style={{ ...requestProgressStepStyle, borderColor: licenseComplete ? "#16a34a" : "#0284c7", color: licenseComplete ? "#16a34a" : "#0284c7" }}>2. Driver&apos;s licence</div>}
                <div style={{ ...requestProgressStepStyle, borderColor: canRequest ? "#0284c7" : "#cbd5e1", color: canRequest ? "#0284c7" : "#64748b" }}>{documentVerificationRequired ? "3" : "2"}. Company request</div>
              </div>
              <div>
                <div style={requestEyebrowStyle}>{documentVerificationRequired ? "Step 3 of 3" : "Step 2 of 2"} · Company access</div>
                <h2 style={requestTitleStyle}>Send a company request</h2>
                <p style={requestDescriptionStyle}>Choose a company and send your request for approval.</p>
              </div>
            </div>
            {documentVerificationRequired && !licenseComplete && (
              <div style={lockedNoticeStyle}>
                <strong>Driver&apos;s licence required</strong>
                <span>Finish uploading a complete driver&apos;s licence before sending a company request.</span>
              </div>
            )}
            {activeRequest && (
              <div style={pendingNoticeStyle}>
                <strong>Your request is {activeRequest.status === "approved" ? "accepted" : "under review"}.</strong>
                <span>You can send another request only after all previous requests are rejected.</span>
              </div>
            )}
            <fieldset disabled={!canRequest} style={fieldsetStyle}>
              <form onSubmit={submitRequest} style={{ display: "grid", gap: "14px" }}>
                <label style={fieldLabelStyle}>Company</label>
                <select value={selectedCompany} onChange={(event) => setSelectedCompany(event.target.value)} style={requestInputStyle} required>
                  <option value="">Choose a company</option>
                  {companies.map((company) => (
                    <option key={company.owner_id} value={company.owner_id}>
                      {company.company_name || `Company ${company.owner_id}`}
                    </option>
                  ))}
                </select>
                <label style={fieldLabelStyle}>Message <span style={{ fontWeight: 400, color: "#94a3b8" }}>Optional</span></label>
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add a short note to the company" rows="4" style={requestInputStyle} />
                <button type="submit" style={{ ...requestButtonStyle, opacity: selectedCompany && canRequest ? 1 : 0.55 }} disabled={!selectedCompany || !canRequest}>Send request</button>
              </form>
            </fieldset>
          </div>
          <div style={{ ...requestPanelStyle, marginTop: "22px" }}>
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
      )
      }

      {
        !joinOnly && (role === "owner" || role === "manager") && (
          <section style={sectionStyle}>
            <div style={requestsHeaderStyle}>
              <div>
                <h2 style={{ margin: 0 }}>Pending Requests</h2>
                {role === "manager" && <p style={{ margin: "6px 0 0" }}>Managers can approve driver requests only.</p>}
              </div>
              <button type="button" onClick={loadRequests} disabled={loading} style={refreshButtonStyle}>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
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
        )
      }
    </div >
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

const requestStepSectionStyle = { display: "grid", gap: "20px", backgroundColor: "transparent", padding: 0, border: 0 };
const requestStepCardStyle = { maxWidth: "680px", width: "100%", boxSizing: "border-box", margin: "0 auto", padding: "24px", border: "1px solid #e2e8f0", borderRadius: "12px", backgroundColor: "white", boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)" };

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

const requestIntroStyle = { display: "grid", gap: "18px", marginBottom: "22px" };
const requestProgressStyle = { display: "flex", gap: "10px" };
const requestProgressStepStyle = { flex: 1, borderTop: "4px solid", paddingTop: "8px", fontSize: "12px", fontWeight: 700 };
const requestEyebrowStyle = { color: "#0284c7", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" };
const requestTitleStyle = { margin: "6px 0 0", fontSize: "30px", color: "#0f172a" };
const requestDescriptionStyle = { margin: "8px 0 0", color: "#64748b" };
const fieldLabelStyle = { color: "#334155", fontSize: "13px", fontWeight: 700, marginBottom: "-8px" };
const requestInputStyle = { width: "100%", boxSizing: "border-box", padding: "12px 13px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "white", color: "#0f172a", font: "inherit" };
const fieldsetStyle = { border: 0, padding: 0, margin: 0, minWidth: 0 };
const requestButtonStyle = { padding: "13px 16px", border: 0, borderRadius: "8px", backgroundColor: "#0284c7", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "15px" };
const lockedNoticeStyle = { display: "grid", gap: "4px", padding: "14px 16px", marginBottom: "16px", borderLeft: "4px solid #94a3b8", borderRadius: "6px", backgroundColor: "#f1f5f9", color: "#475569" };
const pendingNoticeStyle = { display: "grid", gap: "4px", padding: "14px 16px", marginBottom: "16px", borderLeft: "4px solid #f59e0b", borderRadius: "6px", backgroundColor: "#fffbeb", color: "#92400e" };
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
