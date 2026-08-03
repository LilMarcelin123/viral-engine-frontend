import { useState } from "react";
import { Toaster } from "@/components/ui/toaster"
import AlertStack from "@/components/AlertStack"
import ConfirmDialog from "@/components/ConfirmDialog"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from "@/components/layout/AppLayout";
import RoleGuard from "@/components/RoleGuard";
import Editors from "@/pages/Editors";
import Users from "@/pages/Users";
import CampaignsDashboard from "@/pages/CampaignsDashboard";
import ActivityLog from "@/pages/ActivityLog";
import WalletPage from "@/pages/WalletPage";
import CampaignReport from "@/pages/CampaignReport";
import Settings from "@/pages/Settings";
import Support from "@/pages/Support";
import Landing from "@/pages/Landing";
import LoginPage from "@/pages/LoginPage";
import AcceptTermsScreen from "@/pages/AcceptTermsScreen";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();
  const [aceptoLegal, setAceptoLegal] = useState(false);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Sin sesion valida => pantalla de login propia
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Aviso de privacidad y terminos: bloquea la app hasta que se acepten
  if (!aceptoLegal) {
    return <AcceptTermsScreen onAccepted={() => setAceptoLegal(true)} />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<CampaignsDashboard />} />
        <Route path="/editors" element={<RoleGuard roles={["admin"]}><Editors /></RoleGuard>} />
        <Route path="/users" element={<RoleGuard roles={["admin"]}><Users /></RoleGuard>} />
        <Route path="/campaigns" element={<RoleGuard roles={["admin"]}><CampaignsDashboard /></RoleGuard>} />
        <Route path="/activity-log" element={<RoleGuard roles={["admin"]}><ActivityLog /></RoleGuard>} />
        <Route path="/wallet" element={<RoleGuard roles={["admin", "editor"]}><WalletPage /></RoleGuard>} />
        <Route path="/campaign-report" element={<RoleGuard roles={["admin", "cliente"]}><CampaignReport /></RoleGuard>} />
        <Route path="/settings" element={<RoleGuard roles={["admin"]}><Settings /></RoleGuard>} />
        <Route path="/support" element={<RoleGuard roles={["admin"]}><Support /></RoleGuard>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <AlertStack />
        <ConfirmDialog />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;