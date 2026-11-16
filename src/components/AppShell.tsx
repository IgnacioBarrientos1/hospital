import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/lib/supabase';
import { HeartPulse, LogOut, UserCircle2 } from 'lucide-react';

interface ShellProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  doctor: 'Médico',
  patient: 'Paciente',
};

export function AppShell({ title, actions, children }: ShellProps) {
  const { profile, signOut } = useAuth();
  const initials = profile ? `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}` : '';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-hmg-blue text-white shadow-sm">
              <HeartPulse size={20} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-hmg-deep">Hospital Monte Grande</p>
              <p className="text-xs text-slate-500">{ROLE_LABEL[profile?.role ?? 'patient']}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 sm:flex">
              <UserCircle2 size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                {profile?.first_name} {profile?.last_name}
              </span>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
              {initials.toUpperCase()}
            </div>
            <button onClick={signOut} className="btn-ghost" title="Cerrar sesión">
              <LogOut size={18} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {children}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-400 sm:px-6">
        Hospital Monte Grande · Conexión segura HTTPS/TLS · Datos protegidos
      </footer>
    </div>
  );
}
