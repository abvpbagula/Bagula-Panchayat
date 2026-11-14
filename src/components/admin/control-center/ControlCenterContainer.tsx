import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { type ControlCenterSectionId, CONTROL_CENTER_SECTIONS } from "./types";
import { ControlCenterHeader } from "./ControlCenterHeader";
import { ControlCenterSidebar } from "./ControlCenterSidebar";

// 22 Dedicated Section Components
import { DashboardSection } from "./sections/DashboardSection";
import { AppearanceBrandingSection } from "./sections/AppearanceBrandingSection";
import { PublicWebsiteSection } from "./sections/PublicWebsiteSection";
import { NavigationLinksSection } from "./sections/NavigationLinksSection";
import { ServicesCatalogSection } from "./sections/ServicesCatalogSection";
import { CertificateTemplatesSection } from "./sections/CertificateTemplatesSection";
import { PrintPageSetupSection } from "./sections/PrintPageSetupSection";
import { ContentNoticesSection } from "./sections/ContentNoticesSection";
import { CitizenAuthSection } from "./sections/CitizenAuthSection";
import { UsersRolesSection } from "./sections/UsersRolesSection";
import { DeoScopeSection } from "./sections/DeoScopeSection";
import { OnboardingSection } from "./sections/OnboardingSection";
import { DocumentsSection } from "./sections/DocumentsSection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { VerificationSection } from "./sections/VerificationSection";
import { SecurityCenterSection } from "./sections/SecurityCenterSection";
import { MasterDataSection } from "./sections/MasterDataSection";
import { AdminForcedLogoutManager } from "@/components/admin/AdminForcedLogoutManager";
import { SecurityGovernanceCard } from "@/components/admin/SecurityGovernanceCard";
import { AuditLogSection } from "./sections/AuditLogSection";
import { SystemConfigSection } from "./sections/SystemConfigSection";
import { FeatureAvailabilitySection } from "./sections/FeatureAvailabilitySection";
import { BackupRecoverySection } from "./sections/BackupRecoverySection";
import { IntegrationsSection } from "./sections/IntegrationsSection";
import { EnvironmentDeploymentSection } from "./sections/EnvironmentDeploymentSection";

export const ControlCenterContainer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const urlSection = searchParams.get("section") as ControlCenterSectionId | null;

  const [activeSection, setActiveSection] = useState<ControlCenterSectionId>(
    urlSection && CONTROL_CENTER_SECTIONS.some((s) => s.id === urlSection)
      ? urlSection
      : "dashboard"
  );

  useEffect(() => {
    if (urlSection && CONTROL_CENTER_SECTIONS.some((s) => s.id === urlSection)) {
      setActiveSection(urlSection);
    }
  }, [urlSection]);

  const handleSelectSection = (id: ControlCenterSectionId) => {
    setActiveSection(id);
    setSearchParams({ section: id });
  };

  const currentMeta = CONTROL_CENTER_SECTIONS.find((s) => s.id === activeSection) || CONTROL_CENTER_SECTIONS[0];

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection onNavigate={handleSelectSection} />;
      case "appearance":
        return <AppearanceBrandingSection />;
      case "website":
        return <PublicWebsiteSection />;
      case "navigation":
        return <NavigationLinksSection />;
      case "services":
        return <ServicesCatalogSection />;
      case "templates":
        return <CertificateTemplatesSection />;
      case "print-setup":
        return <PrintPageSetupSection />;
      case "notices":
        return <ContentNoticesSection />;
      case "auth":
        return <CitizenAuthSection />;
      case "users-roles":
        return <UsersRolesSection />;
      case "deo-scope":
        return <DeoScopeSection />;
      case "onboarding":
        return <OnboardingSection />;
      case "documents":
        return <DocumentsSection />;
      case "notifications":
        return <NotificationsSection />;
      case "verification":
        return <VerificationSection />;
      case "security":
        return <SecurityCenterSection />;
      case "master-data":
        return <MasterDataSection />;
      case "session-security":
        return (
          <div className="space-y-6">
            <SecurityGovernanceCard />
            <AdminForcedLogoutManager />
          </div>
        );
      case "audit-log":
        return <AuditLogSection />;
      case "system-config":
        return <SystemConfigSection />;
      case "features":
        return <FeatureAvailabilitySection />;
      case "backups":
        return <BackupRecoverySection />;
      case "integrations":
        return <IntegrationsSection />;
      case "environment":
        return <EnvironmentDeploymentSection />;
      default:
        return <DashboardSection onNavigate={handleSelectSection} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ControlCenterHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeSectionTitle={currentMeta.label}
        activeSectionDesc={currentMeta.description}
      />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-20">
            <ControlCenterSidebar
              activeSection={activeSection}
              onSelectSection={handleSelectSection}
              searchQuery={searchQuery}
            />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <div className="mb-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>Super Admin Governance</span>
              <span>/</span>
              <span className="capitalize">{currentMeta.category.replace("_", " ")}</span>
              <span>/</span>
              <span className="text-foreground font-medium">{currentMeta.label}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {currentMeta.label}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentMeta.description}
            </p>
          </div>

          <div className="pb-12">{renderSection()}</div>
        </main>
      </div>
    </div>
  );
};
