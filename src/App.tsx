import { Navigate, Route, Routes } from 'react-router-dom';

import { OnboardingRoute, ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { SuperadminLayout } from '@/components/layout/SuperadminLayout';

import AccountsPage from '@/pages/AccountsPage';
import BudgetsPage from '@/pages/BudgetsPage';
import CategoriesPage from '@/pages/CategoriesPage';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import NotificationsPage from '@/pages/NotificationsPage';
import OAuthCallbackPage from '@/pages/OAuthCallbackPage';
import OnboardingPage from '@/pages/OnboardingPage';
import RecurringPage from '@/pages/RecurringPage';
import RegisterPage from '@/pages/RegisterPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import TransactionsPage from '@/pages/TransactionsPage';
import SsoCallbackPage from '@/pages/SsoCallbackPage';
import SuperadminDashboardPage from '@/pages/superadmin/SuperadminDashboardPage';
import SuperadminUsersPage from '@/pages/superadmin/SuperadminUsersPage';
import SuperadminCurrenciesPage from '@/pages/superadmin/SuperadminCurrenciesPage';
import SuperadminAccountTypesPage from '@/pages/superadmin/SuperadminAccountTypesPage';
import SuperadminCategoriesPage from '@/pages/superadmin/SuperadminCategoriesPage';
import SuperadminAuditLogsPage from '@/pages/superadmin/SuperadminAuditLogsPage';
import SuperadminEmailLogsPage from '@/pages/superadmin/SuperadminEmailLogsPage';
import SuperadminAppSettingsPage from '@/pages/superadmin/SuperadminAppSettingsPage';

function ProtectedAppPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function ProtectedAdminPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SuperadminLayout>{children}</SuperadminLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login"              element={<LoginPage />} />
        <Route path="/register"           element={<RegisterPage />} />
        <Route path="/auth/callback"      element={<OAuthCallbackPage />} />
        <Route path="/auth/sso/callback"  element={<SsoCallbackPage />} />

        {/* Onboarding */}
        <Route
          path="/onboarding"
          element={
            <OnboardingRoute>
              <OnboardingPage />
            </OnboardingRoute>
          }
        />

        {/* Protected app routes */}
        <Route path="/dashboard"     element={<ProtectedAppPage><DashboardPage /></ProtectedAppPage>} />
        <Route path="/accounts"      element={<ProtectedAppPage><AccountsPage /></ProtectedAppPage>} />
        <Route path="/transactions"  element={<ProtectedAppPage><TransactionsPage /></ProtectedAppPage>} />
        <Route path="/categories"    element={<ProtectedAppPage><CategoriesPage /></ProtectedAppPage>} />
        <Route path="/budgets"       element={<ProtectedAppPage><BudgetsPage /></ProtectedAppPage>} />
        <Route path="/recurring"     element={<ProtectedAppPage><RecurringPage /></ProtectedAppPage>} />
        <Route path="/reports"       element={<ProtectedAppPage><ReportsPage /></ProtectedAppPage>} />
        <Route path="/notifications" element={<ProtectedAppPage><NotificationsPage /></ProtectedAppPage>} />
        <Route path="/settings"      element={<ProtectedAppPage><SettingsPage /></ProtectedAppPage>} />

        {/* Superadmin routes — dedicated layout */}
        <Route path="/superadmin"                 element={<ProtectedAdminPage><SuperadminDashboardPage /></ProtectedAdminPage>} />
        <Route path="/superadmin/users"           element={<ProtectedAdminPage><SuperadminUsersPage /></ProtectedAdminPage>} />
        <Route path="/superadmin/currencies"      element={<ProtectedAdminPage><SuperadminCurrenciesPage /></ProtectedAdminPage>} />
        <Route path="/superadmin/account-types"   element={<ProtectedAdminPage><SuperadminAccountTypesPage /></ProtectedAdminPage>} />
        <Route path="/superadmin/categories"      element={<ProtectedAdminPage><SuperadminCategoriesPage /></ProtectedAdminPage>} />
        <Route path="/superadmin/audit-logs"      element={<ProtectedAdminPage><SuperadminAuditLogsPage /></ProtectedAdminPage>} />
        <Route path="/superadmin/email-logs"     element={<ProtectedAdminPage><SuperadminEmailLogsPage /></ProtectedAdminPage>} />
        <Route path="/superadmin/settings"        element={<ProtectedAdminPage><SuperadminAppSettingsPage /></ProtectedAdminPage>} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
