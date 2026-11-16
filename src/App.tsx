import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { DoctorPage } from '@/pages/DoctorPage';
import { PatientPage } from '@/pages/PatientPage';
import { AdminPage } from '@/pages/AdminPage';
import { Loader2 } from 'lucide-react';

function Router() {
  const { user, profile, loading, passwordRecovery } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-400">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (passwordRecovery) return <ResetPasswordPage />;

  if (!user || !profile) return <LoginPage />;

  switch (profile.role) {
    case 'admin': return <AdminPage />;
    case 'doctor': return <DoctorPage />;
    case 'patient': return <PatientPage />;
    default: return <LoginPage />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
