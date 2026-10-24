import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { OnboardingWizard } from "./pages/OnboardingWizard";
import { DashboardPage } from "./pages/DashboardPage";
import { JobDiscoveryPage } from "./pages/JobDiscoveryPage";
import { JobDetailPage } from "./pages/JobDetailPage";
import { ApplicationsTrackerPage } from "./pages/ApplicationsTrackerPage";
import { ResumePage } from "./pages/ResumePage";
import { PreferencesPage } from "./pages/PreferencesPage";
import { EmailCentrePage } from "./pages/EmailCentrePage";
import { AutomationPage } from "./pages/AutomationPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SettingsPage } from "./pages/SettingsPage";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Onboarding Wizard */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingWizard />
              </ProtectedRoute>
            }
          />

          {/* Protected SaaS App with Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/discovery" element={<JobDiscoveryPage />} />
            <Route path="/discovery/:id" element={<JobDetailPage />} />
            <Route path="/applications" element={<ApplicationsTrackerPage />} />
            <Route path="/resumes" element={<ResumePage />} />
            <Route path="/emails" element={<EmailCentrePage />} />
            <Route path="/preferences" element={<PreferencesPage />} />
            <Route path="/automation" element={<AutomationPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
