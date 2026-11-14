import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "@/pages/AdminDashboard";

vi.mock("@/integrations/supabase/client", () => {
  const createQueryMock = () => {
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      neq: () => builder,
      gte: () => builder,
      lte: () => builder,
      order: () => builder,
      limit: () => builder,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => Promise.resolve({ data: [], count: 0, error: null }).then(resolve),
    };
    return builder;
  };

  return {
    supabase: {
      from: () => createQueryMock(),
      auth: {
        signOut: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/permissions", () => ({
  useAuthz: () => ({
    loading: false,
    isAdmin: true,
    isSuperAdmin: false,
    isDeo: false,
    role: "admin",
    user: { id: "admin-1", email: "admin@test.gov.in" },
    roles: ["admin"],
    permissions: {},
  }),
  hasPermission: () => true,
}));

vi.mock("@/lib/activityLog", () => ({
  logActivity: vi.fn(),
}));

describe("AdminDashboard card key uniqueness", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders admin module cards without React duplicate key warnings", async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Verify key elements render
    expect(screen.getByText("🟠 Admin Dashboard")).toBeInTheDocument();
    expect(screen.getAllByText("📥 Pending Review").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("📱 Modify Mobile Number")).toBeInTheDocument();
    expect(screen.getByText("📧 Modify Email Address")).toBeInTheDocument();

    // Check that no duplicate key warning was logged
    const duplicateKeyCalls = consoleErrorSpy.mock.calls.filter((call) =>
      call.some((arg) => typeof arg === "string" && arg.includes("Encountered two children with the same key"))
    );

    expect(duplicateKeyCalls).toHaveLength(0);
  });
});
