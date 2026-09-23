import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Avatar,
  Stack,
  Alert,
  CircularProgress,
  MenuItem,
  Grid,
  Divider,
  Badge,
  Paper,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

function CompanyRequests({
  joinOnly = false,
  showJoinRequest = true,
  requiresDocuments,
}) {
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
      const [
        availableCompanies,
        ownRequests,
        pendingRequests,
        driverDocuments,
      ] = await Promise.all([
        role === "manager" || role === "driver"
          ? apiFetch("/api/company/companies")
          : Promise.resolve([]),
        role === "manager" || role === "driver"
          ? apiFetch("/api/company/requests/mine")
          : Promise.resolve([]),
        role === "owner" || role === "manager"
          ? apiFetch("/api/company/requests/pending")
          : Promise.resolve([]),
        documentVerificationRequired
          ? apiFetch("/api/driver/documents")
          : Promise.resolve([]),
      ]);
      setCompanies(availableCompanies);
      setMine(ownRequests);
      setPending(pendingRequests);
      setLicenseComplete(
        !documentVerificationRequired ||
          driverDocuments.some(
            (document) =>
              document.document_type === "driving_license" &&
              document.document_no &&
              document.issue_date &&
              document.expiry_date &&
              document.document_url,
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

  const activeRequest = mine.find((request) =>
    ["pending", "approved"].includes(request.status),
  );
  const hasOnlyRejectedRequests = mine.every(
    (request) => request.status === "rejected",
  );
  const canRequest =
    licenseComplete && hasOnlyRejectedRequests && !activeRequest;
  const requestLocked = !!activeRequest;

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
      await apiFetch(`/api/company/requests/${requestId}`, {
        method: "DELETE",
      });
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

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 4,
        }}
      >
        <CircularProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">
          Loading company requests...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {error && <Alert severity="error">{error}</Alert>}

      {showJoinRequest && (role === "manager" || role === "driver") && (
        <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={4}>
              {/* Request Form Side */}
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    mb: 3,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Make a request
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      Send one request and wait for the company&apos;s response.
                    </Typography>
                  </Box>
                  <Chip
                    label={
                      requestLocked ? "Request pending" : "Ready to request"
                    }
                    color={requestLocked ? "warning" : "success"}
                    variant={requestLocked ? "filled" : "outlined"}
                    size="small"
                  />
                </Box>

                {requestLocked && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <strong>Your request is under review.</strong>
                    <br />
                    You can request another company after cancelling the pending
                    request.
                  </Alert>
                )}

                <form onSubmit={submitRequest}>
                  <Stack spacing={2}>
                    <TextField
                      select
                      label="Choose a company"
                      value={selectedCompany}
                      onChange={(event) =>
                        setSelectedCompany(event.target.value)
                      }
                      disabled={requestLocked}
                      required
                      fullWidth
                    >
                      <MenuItem value="" disabled>
                        Select a company
                      </MenuItem>
                      {companies.map((company) => (
                        <MenuItem
                          key={company.owner_id}
                          value={company.owner_id}
                        >
                          {company.company_name ||
                            `Company ${company.owner_id}`}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      label="Message (optional)"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      multiline
                      rows={3}
                      disabled={requestLocked}
                      fullWidth
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={!selectedCompany || requestLocked}
                      fullWidth
                    >
                      Send request
                    </Button>
                  </Stack>
                </form>
              </Grid>

              {/* History Side */}
              <Grid item xs={12} md={7}>
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "background.default",
                    borderRadius: 2,
                    height: "100%",
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        display="flex"
                        alignItems="center"
                        gap={1.5}
                      >
                        Your requests
                        {mine.length > 0 && (
                          <Badge badgeContent={mine.length} color="primary" />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Track invitations across every company.
                      </Typography>
                    </Box>
                    <Button
                      onClick={() => window.location.reload()}
                      startIcon={<RefreshIcon />}
                      size="small"
                    >
                      Refresh
                    </Button>
                  </Box>

                  <RequestList
                    requests={mine}
                    empty="No requests sent yet."
                    onCancel={cancelRequest}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {!joinOnly && (role === "owner" || role === "manager") && (
        <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
          <Box
            sx={{
              p: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Pending Requests
              </Typography>
              {role === "manager" && (
                <Typography variant="body2" color="text.secondary">
                  Managers can approve driver requests only.
                </Typography>
              )}
            </Box>
            <Button
              onClick={loadRequests}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={16} /> : <RefreshIcon />
              }
            >
              Refresh
            </Button>
          </Box>
          <CardContent sx={{ p: 0 }}>
            {pending.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  No pending requests.
                </Typography>
              </Box>
            ) : (
              <Stack divider={<Divider />}>
                {pending.map((request) => (
                  <Box
                    key={request.request_id}
                    sx={{
                      p: 3,
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1.5fr 2fr auto" },
                      gap: 3,
                      alignItems: "center",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    {/* Identity */}
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <CustomAvatar
                        name={request.full_name || request.username}
                        image={request.profile_image}
                      />
                      <Box>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {request.profile_id ? (
                            <Link
                              to={getRequestProfileLink(request)}
                              style={{
                                textDecoration: "none",
                                color: "inherit",
                              }}
                            >
                              <Typography
                                fontWeight={600}
                                sx={{
                                  "&:hover": { textDecoration: "underline" },
                                }}
                              >
                                {request.full_name || request.username}
                              </Typography>
                            </Link>
                          ) : (
                            <Typography fontWeight={600}>
                              {request.full_name || request.username}
                            </Typography>
                          )}
                          <Chip
                            size="small"
                            label={request.requested_role}
                            color="primary"
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: "0.7rem",
                              textTransform: "capitalize",
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {request.email}
                        </Typography>
                        {(request.phone ||
                          request.employee_id ||
                          request.department) && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {[
                              request.phone,
                              request.employee_id &&
                                `ID ${request.employee_id}`,
                              request.department,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Details */}
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        display="block"
                        mb={0.5}
                      >
                        Sent {formatDateTime(request.created_at)}
                      </Typography>
                      {request.message && (
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            bgcolor: "background.default",
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            display="block"
                            color="text.secondary"
                            mb={0.5}
                          >
                            Note
                          </Typography>
                          <Typography variant="body2">
                            {request.message}
                          </Typography>
                        </Paper>
                      )}
                    </Box>

                    {/* Actions */}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: { xs: "flex-start", md: "flex-end" },
                      }}
                    >
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => decide(request.request_id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => decide(request.request_id, "reject")}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function RequestList({ requests, empty, onCancel }) {
  if (requests.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
        {empty}
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {requests.map((request) => (
        <Paper
          key={request.request_id}
          elevation={0}
          sx={{
            p: 2,
            border: 1,
            borderColor: "divider",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr auto" },
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <CustomAvatar
              name={request.company_name || "Company"}
              image={request.company_profile_image}
            />
            <Box>
              <Typography fontWeight={600}>
                {request.company_name || "Company"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {request.owner_username
                  ? `Owner: ${request.owner_username}`
                  : "Company details unavailable"}
              </Typography>
              {request.owner_email && (
                <Typography variant="caption" color="text.secondary">
                  {request.owner_email}
                </Typography>
              )}
            </Box>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              display="block"
              mb={0.5}
            >
              Sent {formatDateTime(request.created_at)}
            </Typography>
            {request.message && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ bgcolor: "action.hover", p: 1, borderRadius: 1 }}
              >
                "{request.message}"
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              alignItems: "center",
              justifyContent: { xs: "flex-start", md: "flex-end" },
            }}
          >
            <Chip
              label={request.status}
              color={
                request.status === "approved"
                  ? "success"
                  : request.status === "rejected"
                    ? "error"
                    : "warning"
              }
              size="small"
              sx={{ textTransform: "capitalize", fontWeight: 600 }}
            />
            {request.status === "pending" && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => onCancel(request.request_id)}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}

function getRequestProfileLink(request) {
  if (!request?.profile_id) return null;
  const profilePath =
    request.requested_role === "driver" ? "drivers" : "managers";
  return `/dashboard/${profilePath}/${request.profile_id}`;
}

function formatDateTime(value) {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function CustomAvatar({ name, image }) {
  if (image) {
    return <Avatar src={image} sx={{ width: 46, height: 46 }} />;
  }
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  return (
    <Avatar
      sx={{
        width: 46,
        height: 46,
        bgcolor: "primary.light",
        color: "primary.dark",
        fontWeight: 700,
      }}
    >
      {initials}
    </Avatar>
  );
}

export default CompanyRequests;
