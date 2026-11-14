import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

describe("PasswordStrengthMeter Component", () => {
  it("renders with 0% progress bar and empty state for empty password", () => {
    render(<PasswordStrengthMeter value="" />);

    // Check progress bar aria
    const progress = screen.getByRole("progressbar");
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveAttribute("aria-valuenow", "0");

    // Check requirements checklist is present
    expect(screen.getByText("Requirements Checklist")).toBeInTheDocument();
    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("Uppercase letter (A-Z)")).toBeInTheDocument();
    expect(screen.getByText("Lowercase letter (a-z)")).toBeInTheDocument();
    expect(screen.getByText("Number (0-9)")).toBeInTheDocument();
    expect(screen.getByText("Special character (!@#$%^&* etc.)")).toBeInTheDocument();
  });

  it("updates progress bar and checks off met criteria in real-time", () => {
    const onStrengthChange = vi.fn();
    const { rerender } = render(
      <PasswordStrengthMeter value="abc" onStrengthChange={onStrengthChange} />
    );

    let progress = screen.getByRole("progressbar");
    expect(progress).toHaveAttribute("aria-valuenow", "10");

    // Rerender with strong password
    rerender(
      <PasswordStrengthMeter
        value="Kolkata#2026Secure!"
        onStrengthChange={onStrengthChange}
      />
    );

    progress = screen.getByRole("progressbar");
    // Good or Strong should be >= 75%
    const currentVal = parseInt(progress.getAttribute("aria-valuenow") || "0", 10);
    expect(currentVal).toBeGreaterThanOrEqual(75);

    // Verify submission eligibility is marked
    expect(screen.getByText("✓ Eligible for submission")).toBeInTheDocument();
  });

  it("displays password match checklist item when confirmValue and showMatch are provided", () => {
    const { rerender } = render(
      <PasswordStrengthMeter
        value="Kolkata#2026Secure!"
        confirmValue="DifferentPassword"
        showMatch={true}
      />
    );

    expect(screen.getByText("✕ Passwords do not match yet")).toBeInTheDocument();

    // Rerender with matching password
    rerender(
      <PasswordStrengthMeter
        value="Kolkata#2026Secure!"
        confirmValue="Kolkata#2026Secure!"
        showMatch={true}
      />
    );

    expect(screen.getByText("✓ Passwords match")).toBeInTheDocument();
  });
});
