import React from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  getAlertStatusColor,
  getAlertTypeColor,
  getAlertTypeLabel,
} from "../utils/alerts";

function AlertsTable({
  alerts,
  alertsLoading,
  onRefresh,
  onAlertClick,
  onResolve,
}) {
  const unresolvedAlerts = alerts.filter(
    (alert) => alert.status !== "resolved",
  );
  const resolvedAlerts = alerts.filter((alert) => alert.status === "resolved");

  const renderTable = (rows, emptyText, showResolvedButton = true) => {
    if (rows.length === 0) {
      return (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "italic" }}
        >
          {emptyText}
        </Typography>
      );
    }

    return (
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}
      >
        <Table size="small" sx={{ minWidth: 900 }}>
          <TableHead sx={{ bgcolor: "background.default" }}>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>About</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>Deadline</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((alert) => (
              <TableRow
                key={`${alert.alert_type}:${alert.alert_id}`}
                hover
                onClick={() => onAlertClick(alert.alert_type, alert.alert_id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>
                  <Chip
                    label={getAlertTypeLabel(alert.alert_type)}
                    color={getAlertTypeColor(alert.alert_type)}
                    size="small"
                    sx={{ fontWeight: 700, textTransform: "none" }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{alert.about || alert.title || 'System alert'}</Typography>
                  {alert.metadata?.driver_name && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      Driver: {alert.metadata.driver_name}
                    </Typography>
                  )}
                  {alert.metadata?.document_type && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      Document: {alert.metadata.document_type.replaceAll('_', ' ')}
                    </Typography>
                  )}
                  {alert.metadata?.issue_date && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      Issued: {new Date(alert.metadata.issue_date).toLocaleDateString()}
                    </Typography>
                  )}
                  <Typography variant="caption" display="block" color="text.secondary">
                    Expiry: {alert.metadata?.expiry_date ? new Date(alert.metadata.expiry_date).toLocaleDateString() : 'Missing'}
                  </Typography>
                  {alert.description && (
                    <Typography variant="caption" color="text.secondary">
                      {alert.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(
                    alert.created_at || alert.event_time,
                  ).toLocaleString()}
                </TableCell>
                <TableCell>
                  {alert.deadline
                    ? new Date(alert.deadline).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={alert.status}
                    color={getAlertStatusColor(alert.status)}
                    size="small"
                    sx={{ fontWeight: 700, textTransform: "capitalize" }}
                  />
                </TableCell>
                <TableCell
                  align="right"
                  onClick={(event) => event.stopPropagation()}
                >
                  {showResolvedButton && (
                    <Button
                      variant="contained"
                      color={
                        alert.status === "resolved" ? "inherit" : "success"
                      }
                      size="small"
                      disabled={alert.status === "resolved"}
                      onClick={() =>
                        onResolve(alert.alert_type, alert.alert_id)
                      }
                    >
                      {alert.status === "resolved"
                        ? "Resolved"
                        : "Mark resolved"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          System Alerts
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={onRefresh}
          disabled={alertsLoading}
          startIcon={
            alertsLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <RefreshIcon />
            )
          }
        >
          Refresh alerts
        </Button>
      </Box>

      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 4 }}>
        {alertsLoading ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <CircularProgress size={28} sx={{ mb: 2 }} />
            <Typography>Loading alerts...</Typography>
          </Box>
        ) : (
          <>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Unresolved Alerts
              </Typography>
              {renderTable(unresolvedAlerts, "No unresolved alerts.", true)}
            </Box>

            <Box>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Alert History
              </Typography>
              {renderTable(resolvedAlerts, "No resolved alerts yet.", false)}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}

export default AlertsTable;
