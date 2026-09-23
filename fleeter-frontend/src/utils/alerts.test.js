import {
  getAlertTypeColor,
  getAlertStatusColor,
  getAlertStatusLabel,
} from "./alerts";

describe("alert utilities", () => {
  test("uses the requested alert colors for system alert types", () => {
    expect(getAlertTypeColor("incident")).toBe("error");
    expect(getAlertTypeColor("driver_document_expired")).toBe("error");
    expect(getAlertTypeColor("maintenance")).toBe("warning");
    expect(getAlertTypeColor("refuel")).toBe("success");
  });

  test("maps status labels to expected UI colors", () => {
    expect(getAlertStatusLabel(false, null)).toBe("needs to be resolved");
    expect(getAlertStatusLabel(false, new Date("2026-01-01T00:00:00Z"))).toBe(
      "deadline expired",
    );
    expect(getAlertStatusLabel(true, null)).toBe("resolved");
    expect(getAlertStatusColor("needs to be resolved")).toBe("warning");
    expect(getAlertStatusColor("deadline expired")).toBe("error");
    expect(getAlertStatusColor("resolved")).toBe("success");
  });
});
