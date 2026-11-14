import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GovHeader from "@/components/GovHeader";
import GovFooter from "@/components/GovFooter";
import Index from "./pages/Index.tsx";
import AdminAuth from "./pages/AdminAuth.tsx";
import RequirePermission from "./components/RequirePermission";
import RequireAdmin from "./components/RequireAdmin";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NavigationHistoryProvider } from "@/hooks/useGoBack";
import { DevelopmentDisclaimerModal } from "@/components/legal/DevelopmentDisclaimerModal";
import { PrivatePasscodeGate } from "@/components/security/PrivatePasscodeGate";

// Route-level code splitting for faster initial load
const FaqPage = lazy(() => import("./pages/FaqPage.tsx"));
const ServiceDetailPage = lazy(() => import("./pages/ServiceDetailPage"));
const DependentCertificate = lazy(() => import("./pages/DependentCertificate.tsx"));
const WarishCertificate = lazy(() => import("./pages/WarishCertificate.tsx"));
const LinkageCertificate = lazy(() => import("./pages/LinkageCertificate.tsx"));
const ScStLineageVerification = lazy(() => import("./pages/ScStLineageVerification.tsx"));
const WarishApplicationFormPage = lazy(() => import("./pages/WarishApplicationFormPage.tsx"));
const BirthDigitizationFormPage = lazy(() => import("./pages/BirthDigitizationFormPage.tsx"));
const DelayedRegistrationPage = lazy(() => import("./pages/DelayedRegistrationPage.tsx"));
const WbpmsInfo = lazy(() => import("./pages/WbpmsInfo.tsx"));
const ElectedRepresentatives = lazy(() => import("./pages/ElectedRepresentatives.tsx"));
const ElectedMemberPortal = lazy(() => import("./pages/ElectedMemberPortal.tsx"));
const CyberCafePortal = lazy(() => import("./pages/CyberCafePortal.tsx"));
const Verify = lazy(() => import("./pages/Verify.tsx"));
const PublicTracker = lazy(() => import("./pages/PublicTracker.tsx"));
const DarHub = lazy(() => import("./pages/dar/DarHub.tsx"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent.tsx"));
const ApplicationWizard = lazy(() => import("./pages/deo/ApplicationWizard.tsx"));

const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const DeoDashboard = lazy(() => import("./pages/DeoDashboard.tsx"));
const AdminWhatsNew = lazy(() => import("./pages/AdminWhatsNew.tsx"));
const AdminWarishList = lazy(() => import("./pages/AdminWarishList.tsx"));
const AdminDependentList = lazy(() => import("./pages/AdminDependentList.tsx"));
const AdminManageAdmins = lazy(() => import("./pages/AdminManageAdmins.tsx"));
const AdminAccountSettings = lazy(() => import("./pages/AdminAccountSettings.tsx"));
const AdminBackups = lazy(() => import("./pages/AdminBackups.tsx"));
const AdminReview = lazy(() => import("./pages/AdminReview.tsx"));
const AdminMasterData = lazy(() => import("./pages/AdminMasterData.tsx"));
const AdminEmployees = lazy(() => import("./pages/AdminEmployees.tsx"));
const AdminActivityLog = lazy(() => import("./pages/AdminActivityLog.tsx"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications.tsx"));
const AdminDigitalizationSettings = lazy(() => import("./pages/AdminDigitalizationSettings.tsx"));
const AdminCertificateTemplates = lazy(() => import("./pages/admin/AdminCertificateTemplates.tsx"));
const CertificateTemplateDesigner = lazy(() => import("./pages/admin/CertificateTemplateDesigner.tsx"));
const AdminPortalControls = lazy(() => import("./pages/AdminPortalControls.tsx"));
const AdminProfilesDirectory = lazy(() => import("./pages/AdminProfilesDirectory.tsx"));
const AdminDeoQuotas = lazy(() => import("./pages/AdminDeoQuotas.tsx"));
const AdminSystemStatusPage = lazy(() => import("./pages/AdminSystemStatusPage.tsx"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics.tsx"));
const AdminAuthChecklistPage = lazy(() => import("./pages/AdminAuthChecklistPage.tsx"));
const AdminAuthAuditPage = lazy(() => import("./pages/AdminAuthAuditPage.tsx"));
const AdminDiagnostics = lazy(() => import("./pages/AdminDiagnostics.tsx"));
const SuperAdminControlCenterPage = lazy(() => import("./pages/admin/SuperAdminControlCenterPage.tsx"));
const ComingSoon = lazy(() => import("./pages/ComingSoon.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

function LegacyPublicApplyRedirect() {
  const { kind } = useParams();
  const safeKind = kind === "dependent" || kind === "linkage" ? kind : "warish";
  return <Navigate to={`/apply/${safeKind}`} replace />;
}

function RouteLoadingFallback() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading workspace"
      className="flex min-h-[45vh] flex-col items-center justify-center gap-3 px-4 py-12 text-center"
    >
      <Loader2 className="h-6 w-6 animate-spin text-blue-700" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-600">Loading workspace...</p>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const isDarHub = location.pathname.startsWith("/dar");
  const isAdmin = location.pathname.startsWith("/admin");
  const isPrivateGate = location.pathname === "/private-gate" || location.pathname === "/journey";
  const hideChrome = isDarHub || isAdmin || isPrivateGate;

  return (
    <PrivatePasscodeGate>
      {!hideChrome && <GovHeader />}
      <main className={hideChrome ? "" : "flex-1"}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/private-gate" element={<PrivatePasscodeGate standaloneMode />} />
            <Route path="/journey" element={<PrivatePasscodeGate standaloneMode />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/dar" element={<DarHub />} />
            <Route path="/service/:slug" element={<ServiceDetailPage />} />
            <Route path="/dependent-certificate" element={<RequireAdmin><DependentCertificate /></RequireAdmin>} />
            <Route path="/warish-certificate" element={<RequireAdmin><WarishCertificate /></RequireAdmin>} />
            <Route path="/linkage-certificate" element={<RequireAdmin><LinkageCertificate /></RequireAdmin>} />
            <Route path="/sc-st-lineage" element={<ScStLineageVerification />} />
            <Route path="/paternal-lineage" element={<ScStLineageVerification />} />
            <Route path="/caste-lineage" element={<ScStLineageVerification />} />
            <Route path="/warish-application-form" element={<WarishApplicationFormPage />} />
            <Route path="/warish-form" element={<WarishApplicationFormPage />} />
            <Route path="/birth-digitization-form" element={<BirthDigitizationFormPage />} />
            <Route path="/birth-form" element={<BirthDigitizationFormPage />} />
            <Route path="/legacy-birth-form" element={<BirthDigitizationFormPage />} />
            <Route path="/delayed-registration-form" element={<DelayedRegistrationPage />} />
            <Route path="/delayed-registration" element={<DelayedRegistrationPage />} />
            <Route path="/delayed-form" element={<DelayedRegistrationPage />} />
            <Route path="/wbpms-info" element={<WbpmsInfo />} />
            <Route path="/elected-representatives" element={<ElectedRepresentatives />} />
            <Route path="/elected-portal" element={<ElectedMemberPortal />} />
            <Route path="/cyber-cafe" element={<CyberCafePortal />} />
            <Route
              path="/apply/:kind"
              element={
                <ErrorBoundary name="CyberCafeApplicationWizard">
                  <ApplicationWizard cyberCafeMode />
                </ErrorBoundary>
              }
            />
            <Route path="/verify" element={<Verify />} />
            <Route path="/track" element={<Verify defaultTab="track" />} />
            <Route path="/track-status" element={<Verify defaultTab="track" />} />
            <Route path="/tracker" element={<PublicTracker />} />
            <Route path="/accountability-tracker" element={<PublicTracker />} />
            <Route path="/wb-tracker" element={<PublicTracker />} />

            {/* Legacy /public/* redirects cleanly into open-access Cyber Cafe Hub */}
            <Route path="/public" element={<Navigate to="/cyber-cafe" replace />} />
            <Route path="/public/faq" element={<Navigate to="/faq" replace />} />
            <Route path="/public/apply/:kind" element={<LegacyPublicApplyRedirect />} />
            <Route path="/public/*" element={<Navigate to="/cyber-cafe" replace />} />

            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

            {/* Office Login & Protected DEO / Admin / Super Admin Workspaces */}
            <Route path="/admin" element={<ErrorBoundary name="AdminAuth"><AdminAuth /></ErrorBoundary>} />
            <Route path="/admin/dashboard" element={<RequireAdmin><ErrorBoundary name="AdminDashboard"><AdminDashboard /></ErrorBoundary></RequireAdmin>} />
            <Route path="/admin/deo" element={<RequireAdmin><ErrorBoundary name="DeoDashboard"><DeoDashboard /></ErrorBoundary></RequireAdmin>} />
            <Route path="/admin/deo/apply/:kind" element={<RequireAdmin><ErrorBoundary name="ApplicationWizard"><ApplicationWizard /></ErrorBoundary></RequireAdmin>} />
            <Route path="/admin/control-center" element={<RequireAdmin><RequirePermission permission="admins" superAdminOnly><ErrorBoundary name="SuperAdminControlCenter"><SuperAdminControlCenterPage /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/governance" element={<RequireAdmin><RequirePermission permission="admins" superAdminOnly><ErrorBoundary name="SuperAdminControlCenter"><SuperAdminControlCenterPage /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/digitalization-settings" element={<RequireAdmin><RequirePermission permission="admins" superAdminOnly><ErrorBoundary name="AdminDigitalizationSettings"><AdminDigitalizationSettings /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/system-settings" element={<RequireAdmin><RequirePermission permission="admins" superAdminOnly><ErrorBoundary name="AdminDigitalizationSettings"><AdminDigitalizationSettings /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/templates" element={<RequireAdmin><ErrorBoundary name="AdminCertificateTemplates"><AdminCertificateTemplates /></ErrorBoundary></RequireAdmin>} />
            <Route path="/admin/templates/designer" element={<RequireAdmin><ErrorBoundary name="CertificateTemplateDesigner"><CertificateTemplateDesigner /></ErrorBoundary></RequireAdmin>} />
            <Route path="/admin/page-setup" element={<RequireAdmin><ErrorBoundary name="AdminCertificateTemplates"><AdminCertificateTemplates /></ErrorBoundary></RequireAdmin>} />
            <Route path="/admin/portal-controls" element={<RequireAdmin><RequirePermission permission="admins" superAdminOnly><ErrorBoundary name="AdminPortalControls"><AdminPortalControls /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/review" element={<RequireAdmin><ErrorBoundary name="AdminReview"><AdminReview /></ErrorBoundary></RequireAdmin>} />
            <Route path="/admin/warish" element={<RequireAdmin><RequirePermission permission="warish_certs"><ErrorBoundary name="AdminWarishList"><AdminWarishList /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/dependent" element={<RequireAdmin><RequirePermission permission="dependent_certs"><ErrorBoundary name="AdminDependentList"><AdminDependentList /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/notices" element={<RequireAdmin><RequirePermission permission="notices"><ErrorBoundary name="AdminWhatsNew"><AdminWhatsNew /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/whats-new" element={<RequireAdmin><RequirePermission permission="notices"><ErrorBoundary name="AdminWhatsNew"><AdminWhatsNew /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/manage" element={<RequireAdmin><RequirePermission permission="admins" superAdminOnly><ErrorBoundary name="AdminManageAdmins"><AdminManageAdmins /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/master-data" element={<RequireAdmin><RequirePermission permission="admins" superAdminOnly><ErrorBoundary name="AdminMasterData"><AdminMasterData /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/employees" element={<RequireAdmin><RequirePermission permission="admins" superAdminOnly><ErrorBoundary name="AdminEmployees"><AdminEmployees /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/profiles-directory" element={<RequireAdmin><RequirePermission permission="admins"><ErrorBoundary name="AdminProfilesDirectory"><AdminProfilesDirectory /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/citizen-cyber-profiles" element={<RequireAdmin><RequirePermission permission="admins"><ErrorBoundary name="AdminProfilesDirectory"><AdminProfilesDirectory /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/deo-quotas" element={<RequireAdmin><ErrorBoundary name="AdminDeoQuotas"><AdminDeoQuotas /></ErrorBoundary></RequireAdmin>} />
            <Route path="/admin/deo-tiers" element={<RequireAdmin><ErrorBoundary name="AdminDeoQuotas"><AdminDeoQuotas /></ErrorBoundary></RequireAdmin>} />
            <Route path="/admin/deo-permissions" element={<RequireAdmin><ErrorBoundary name="AdminDeoQuotas"><AdminDeoQuotas /></ErrorBoundary></RequireAdmin>} />
            <Route path="/admin/activity" element={<RequireAdmin><RequirePermission permission="admins" superAdminOnly><ErrorBoundary name="AdminActivityLog"><AdminActivityLog /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/notifications" element={<RequireAdmin><ErrorBoundary name="AdminNotifications"><AdminNotifications /></ErrorBoundary></RequireAdmin>} />
            <Route path="/admin/account" element={<RequireAdmin><ErrorBoundary name="AdminAccountSettings"><AdminAccountSettings /></ErrorBoundary></RequireAdmin>} />
            <Route path="/admin/system-status" element={<RequireAdmin><RequirePermission permission="admins" superAdminOnly><ErrorBoundary name="AdminSystemStatusPage"><AdminSystemStatusPage /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/diagnostics" element={<RequireAdmin><RequirePermission permission="admins" superAdminOnly><ErrorBoundary name="AdminDiagnostics"><AdminDiagnostics /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/analytics" element={<RequireAdmin><ErrorBoundary name="AdminAnalytics"><AdminAnalytics /></ErrorBoundary></RequireAdmin>} />
            <Route path="/admin/auth-audit" element={<RequireAdmin><RequirePermission permission="admins" superAdminOnly><ErrorBoundary name="AdminAuthAuditPage"><AdminAuthAuditPage /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/auth-checklist" element={<RequireAdmin><RequirePermission permission="admins" superAdminOnly><ErrorBoundary name="AdminAuthChecklistPage"><AdminAuthChecklistPage /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/backups" element={<RequireAdmin><RequirePermission permission="backups" superAdminOnly><ErrorBoundary name="AdminBackups"><AdminBackups /></ErrorBoundary></RequirePermission></RequireAdmin>} />
            <Route path="/admin/*" element={<RequireAdmin><ErrorBoundary name="ComingSoon"><ComingSoon /></ErrorBoundary></RequireAdmin>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!hideChrome && <GovFooter />}
    </PrivatePasscodeGate>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NavigationHistoryProvider>
          <div className="min-h-screen flex flex-col">
            <DevelopmentDisclaimerModal />
            <AppLayout />
          </div>
        </NavigationHistoryProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
