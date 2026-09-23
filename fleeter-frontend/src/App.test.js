import { render, screen } from "@testing-library/react";
import CompanyRequests from "./components/CompanyRequests";
import { apiFetch } from "./utils/api";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("./utils/api", () => ({
  apiFetch: jest.fn(),
}));

describe("CompanyRequests", () => {
  beforeEach(() => {
    localStorage.setItem("role", "owner");
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("renders pending request names as links to the driver or manager profile", async () => {
    apiFetch.mockImplementation((endpoint) => {
      if (endpoint === "/api/company/requests/pending") {
        return Promise.resolve([
          {
            request_id: 1,
            requester_user_id: 42,
            requested_role: "driver",
            full_name: "Jane Driver",
            username: "jane",
            email: "jane@example.com",
            created_at: "2024-01-02T10:00:00Z",
            profile_id: 99,
          },
        ]);
      }
      return Promise.resolve([]);
    });

    render(<CompanyRequests showJoinRequest={false} />);

    const link = await screen.findByRole("link", { name: /jane driver/i });
    expect(link).toHaveAttribute("href", "/dashboard/drivers/99");
  });
});
