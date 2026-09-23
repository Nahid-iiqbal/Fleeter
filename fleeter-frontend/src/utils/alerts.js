export function getAlertTypeColor(type) {
  switch (type) {
    case "incident":
    case "driver_document_expired":
    case "vehicle_document_expired":
    case "document_expired":
      return "error";
    case "maintenance":
      return "warning";
    case "refuel":
      return "success";
    default:
      return "default";
  }
}

export function getAlertTypeLabel(type) {
  switch (type) {
    case "incident":
      return "Incident";
    case "maintenance":
      return "Maintenance";
    case "driver_document_expired":
      return "Driver document expired";
    case "vehicle_document_expired":
      return "Vehicle document expired";
    case "document_expired":
      return "Document expired";
    case "refuel":
      return "Vehicle refuelled";
    default:
      return "Alert";
  }
}

export function getAlertStatusLabel(resolved, deadline) {
  if (resolved) {
    return "resolved";
  }

  if (deadline && new Date(deadline) < new Date()) {
    return "deadline expired";
  }

  return "needs to be resolved";
}

export function getAlertStatusColor(status) {
  switch (status) {
    case "resolved":
      return "success";
    case "deadline expired":
      return "error";
    case "needs to be resolved":
      return "warning";
    default:
      return "default";
  }
}
