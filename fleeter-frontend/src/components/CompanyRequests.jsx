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

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!selectedCompany) return;

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
          <h2>Join a Company</h2>
          <form onSubmit={submitRequest} style={{ display: "grid", gap: "12px", maxWidth: "520px" }}>
            <select value={selectedCompany} onChange={(event) => setSelectedCompany(event.target.value)} required>
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.owner_id} value={company.owner_id}>
                  {company.company_name || `Company ${company.owner_id}`}
                </option>
              ))}
            </select>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message (optional)" rows="3" />
            <button type="submit" style={buttonStyle}>Send request</button>
          </form>
          <h3>Your requests</h3>
          <RequestList requests={mine} empty="No requests sent." />
        </section>
      )}

      {!joinOnly && (role === "owner" || role === "manager") && (
        <section style={sectionStyle}>
          <h2>Pending Requests</h2>
          {role === "manager" && <p>Managers can approve driver requests only.</p>}
          {pending.map((request) => (
            <div key={request.request_id} style={requestStyle}>
              <div>
                <strong>{request.full_name || request.username}</strong> ({request.requested_role})
                <div>{request.email}</div>
                {request.message && <div>{request.message}</div>}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
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

function RequestList({ requests, empty }) {
  if (requests.length === 0) return <p>{empty}</p>;
  return requests.map((request) => (
    <div key={request.request_id} style={requestStyle}>
      <span>{request.company_name}</span>
      <strong>{request.status}</strong>
    </div>
  ));
}

const sectionStyle = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
};

const requestStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "center",
  padding: "12px 0",
  borderBottom: "1px solid #eee",
};

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
