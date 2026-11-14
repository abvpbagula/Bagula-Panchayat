import React from "react";
import { PasswordStrengthMeter } from "./security/PasswordStrengthMeter";

interface PasswordRequirementsIndicatorProps {
  password: string;
  confirmPassword?: string;
  showMatch?: boolean;
  className?: string;
  title?: string;
}

export const PasswordRequirementsIndicator: React.FC<PasswordRequirementsIndicatorProps> = ({
  password,
  confirmPassword,
  showMatch = false,
  className = "",
  title = "Password Security & Strength",
}) => {
  return (
    <PasswordStrengthMeter
      value={password}
      confirmValue={confirmPassword}
      showMatch={showMatch}
      showRequirements={true}
      className={className}
      title={title}
      mode="password"
    />
  );
};
