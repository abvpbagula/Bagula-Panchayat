import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import {
  ROLE_PERMISSIONS,
  hasPermission,
  hasServiceScope,
  type OfficeRole,
} from "@/lib/permissions";
import { DataStateView } from "@/components/shared/DataStateView";
import { AccessibleActionCard } from "@/components/shared/AccessibleActionCard";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import CyberCafePortal from "@/pages/CyberCafePortal";
import ElectedMemberPortal from "@/pages/ElectedMemberPortal";

vi.mock("@/components/tools/CyberToolsAndGovernmentPortals", () => ({
  CyberToolsAndGovernmentPortals: () => <div data-testid="cyber-tools-hub">Cyber Tools &amp; Portals</div>,
}));

vi.mock("@/pages/member/MemberEpicLinkageVerificationPanel", () => ({
  default: () => <div data-testid="member-epic-panel">EPIC Linkage Verification Desk</div>,
}));

describe("Office Role Consolidation (DEO, Admin, Super Admin only)", () => {
  it("defines permissions exclusively for deo, admin, and super_admin roles", () => {
    const roles = Object.keys(ROLE_PERMISSIONS).sort();
    expect(roles).toEqual(["admin", "deo", "super_admin"]);
  });

  it("enforces strict separation of duties across roles", () => {
    // DEO can create/edit certificates but cannot administer accounts or backups
    expect(hasPermission({ role: "deo" }, "warish_certs", "create")).toBe(true);
    expect(hasPermission({ role: "deo" }, "admins", "view")).toBe(false);
    expect(hasPermission({ role: "deo" }, "backups", "view")).toBe(false);

    // Admin can review/edit certificates but cannot create or manage staff
    expect(hasPermission({ role: "admin" }, "warish_certs", "view")).toBe(true);
    expect(hasPermission({ role: "admin" }, "warish_certs", "edit")).toBe(true);
    expect(hasPermission({ role: "admin" }, "warish_certs", "create")).toBe(false);
    expect(hasPermission({ role: "admin" }, "admins", "edit")).toBe(false);

    // Super Admin has full authority
    expect(hasPermission({ role: "super_admin" }, "admins", "delete")).toBe(true);
    expect(hasPermission({ role: "super_admin" }, "backups", "create")).toBe(true);

    // Non-office roles (null or removed roles) are denied everything
    expect(hasPermission({ role: null }, "warish_certs", "view")).toBe(false);
    expect(hasPermission({ role: "citizen" as unknown as OfficeRole }, "warish_certs", "view")).toBe(false);
    expect(hasPermission({ role: "monitoring_authority" as unknown as OfficeRole }, "admins", "view")).toBe(false);
  });

  it("checks DEO serviceScope accurately while granting admin & super_admin full scope", () => {
    expect(hasServiceScope({ role: "deo", serviceScope: ["warish"] }, "warish")).toBe(true);
    expect(hasServiceScope({ role: "deo", serviceScope: ["warish"] }, "dependent")).toBe(false);
    expect(hasServiceScope({ role: "admin", serviceScope: [] }, "dependent")).toBe(true);
    expect(hasServiceScope({ role: "super_admin", serviceScope: null }, "linkage")).toBe(true);
  });
});

describe("Open-Access Workspaces (Zero Public Login Gates)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders CyberCafePortal directly with /apply/* links and zero login inputs", () => {
    const { container } = render(
      <HelmetProvider>
        <MemoryRouter>
          <CyberCafePortal />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(screen.getByText(/Cyber Cafe & Assisted Service Hub/i)).toBeInTheDocument();
    expect(screen.getByTestId("cyber-tools-hub")).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeNull();
    expect(screen.getByRole("link", { name: /Start Warish Application/i })).toHaveAttribute(
      "href",
      "/apply/warish"
    );
  });

  it("renders ElectedMemberPortal directly with zero PIN login gate", () => {
    const { container } = render(
      <HelmetProvider>
        <MemoryRouter>
          <ElectedMemberPortal />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(screen.getByTestId("member-epic-panel")).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeNull();
    expect(localStorage.getItem("b2gp_elected_member_auth")).toBeNull();
    expect(localStorage.getItem("b2gp_logged_in_cyber_kiosk")).toBeNull();
  });
});

describe("Reusable Accessible Shared UI Components", () => {
  it("DataStateView renders accessible loading, error+retry, empty, and content states", () => {
    const onRetry = vi.fn();

    const { rerender } = render(
      <DataStateView isLoading loadingLabel="Fetching records...">
        <div>Content</div>
      </DataStateView>
    );
    const statusEl = screen.getByRole("status");
    expect(statusEl).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Fetching records...")).toBeInTheDocument();

    rerender(
      <DataStateView isError errorTitle="Sync Error" errorMessage="Network offline" onRetry={onRetry}>
        <div>Content</div>
      </DataStateView>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Try Again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(
      <DataStateView isEmpty emptyTitle="Nothing queued" emptyDescription="No items found">
        <div>Content</div>
      </DataStateView>
    );
    expect(screen.getByText("Nothing queued")).toBeInTheDocument();

    rerender(
      <DataStateView>
        <div>Loaded Workspace</div>
      </DataStateView>
    );
    expect(screen.getByText("Loaded Workspace")).toBeInTheDocument();
  });

  it("AccessibleActionCard and PageSectionHeader render semantic landmarks and actions", () => {
    const onAction = vi.fn();
    render(
      <MemoryRouter>
        <PageSectionHeader
          headingId="sec-head"
          kicker="Section Kicker"
          title="Workspace Title"
          description="Accessible overview text"
        />
        <AccessibleActionCard
          title="Action Card"
          description="Card body"
          ctaLabel="Trigger Action"
          onClick={onAction}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 2, name: "Workspace Title" })).toHaveAttribute("id", "sec-head");
    fireEvent.click(screen.getByRole("button", { name: /Trigger Action/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
