import React from "react";
import DelayedRegistrationPortal from "@/components/delayed/DelayedRegistrationPortal";
import { PublicFormBackendBanner } from "@/components/citizen/PublicFormBackendBanner";

export default function DelayedRegistrationPage() {
  return (
    <div>
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <PublicFormBackendBanner
          serviceCode="DELAYED_REGISTRATION"
          serviceTitle="Delayed Birth / Death Registration (Section 13(3) RBD Act)"
          serviceTitleBn="বিলম্বিত জন্ম বা মৃত্যু নিবন্ধন (১ বছর পর)"
        />
      </div>
      <DelayedRegistrationPortal />
    </div>
  );
}
