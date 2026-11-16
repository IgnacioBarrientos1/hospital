import { useCallback, useEffect, useState } from 'react';
import { supabase, Appointment, Profile, Role } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { AppointmentModal } from '@/components/AppointmentModal';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatTime, fullName, maskEmail } from '@/lib/format';
import { Modal } from '@/components/Modal';
import {
  Plus, Pencil, Trash2, CalendarDays, Users, UserCog, Activity, XCircle,
  LayoutDashboard, CalendarRange, Inbox, Loader2, AlertCircle, Filter, Save,
} from 'lucide-react';

type Tab = 'dashboard' | 'appointments' | 'users';

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const { profile } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // appointment modal
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  // user modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  // filters
  const [apptFilter, setApptFilter] = useState('');
  const [userFilter, setUserFilter] = useState<'' | Role>('');

  const load = useCallback(async () => {
    setLoading(true);
    const [apptRes, userRes, docRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('*, patient:profiles!appointments_patient_id_fkey(*), doctor:profiles!appointments_doctor_id_fkey(*)')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'doctor').order('last_name'),
    ]);
    if (apptRes.error) setError(apptRes.error.message);
    else setAppointments(apptRes.data as Appointment[]);
    if (userRes.data) setUsers(userRes.data as Profile[]);
    if (docRes.data) setDoctors(docRes.data as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ---- appointment handlers ----
  const saveAppt = async (data: {
    doctor_id: string; appointment_date: string; appointment_time: string;
    specialty: string; notes: string | null; status: 'pending' | 'confirmed' | 'cancelled';
  }) => {
    if (editingAppt) {
      const { error } = await supabase
        .from('appointments')
        .update({
          doctor_id: data.doctor_id, appointment_date: data.appointment_date,
          appointment_time: data.appointment_time, specialty: data.specialty,
          notes: data.notes, status: data.status,
        })
        .eq('id', editingAppt.id);
      if (error) return { error: error.message };
    } else {
      if (!profile) return { error: 'Sin sesión.' };
      const { error } = await supabase.from('appointments').insert({
        patient_id: profile.id, // admin creates as self-patient placeholder
        doctor_id: data.doctor_id, appointment_date: data.appointment_date,
        appointment_time: data.appointment_time, specialty: data.specialty,
        notes: data.notes, status: data.status,
      });
      if (error) return { error: error.message };
    }
    await load();
    return { error: null };
  };

  const deleteAppt = async (id: string) => {
    if (!confirm('¿Eliminar este turno?')) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) { setError(error.message); return; }
    await load();
  };

  // ---- user handlers ----
  const saveUser = async (data: { first_name: string; last_name: string; role: Role }) => {
    if (!editingUser) return { error: null };
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: data.first_name.trim(), last_name: data.last_name.trim(), role: data.role })
      .eq('id', editingUser.id);
    if (error) return { error: error.message };
    await load();
    return { error: null };
  };

  const deleteUser = async (id: string) => {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) { setError(error.message); return; }
    await load();
  };

  // ---- derived dashboard data ----
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.appointment_date === today);
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;
  const doctorsCount = users.filter((u) => u.role === 'doctor').length;
  const patientsCount = users.filter((u) => u.role === 'patient').length;
  const recentAppts = appointments.slice(0, 3);
  const recentUsers = users.slice(0, 3);

  const filteredAppts = apptFilter
    ? appointments.filter((a) => a.appointment_date === apptFilter)
    : appointments;
  const filteredUsers = userFilter ? users.filter((u) => u.role === userFilter) : users;

  const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Turnos', icon: CalendarRange },
    { id: 'users', label: 'Usuarios', icon: Users },
  ];

  return (
    <AppShell
      title="Panel de administración"
      actions={
        tab === 'appointments' ? (
          <button className="btn-primary" onClick={() => { setEditingAppt(null); setApptModalOpen(true); }}>
            <Plus size={16} /> Nuevo turno
          </button>
        ) : null
      }
    >
      {/* tabs */}
      <div className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                active ? 'bg-hmg-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-20 text-slate-400"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="animate-fade-in">
          {tab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard icon={CalendarDays} label="Turnos del día" value={todayAppts.length} tone="sky" />
                <KpiCard icon={UserCog} label="Médicos registrados" value={doctorsCount} tone="blue" />
                <KpiCard icon={Users} label="Pacientes registrados" value={patientsCount} tone="emerald" />
                <KpiCard icon={XCircle} label="Turnos cancelados" value={cancelledCount} tone="rose" />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent appointments */}
                <div className="card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="font-semibold text-slate-800">Últimos turnos recientes</h3>
                    <button className="text-sm font-semibold text-sky-600 hover:text-sky-700" onClick={() => setTab('appointments')}>Ver todos</button>
                  </div>
                  <RecentAppts rows={recentAppts} onEdit={(a) => { setEditingAppt(a); setApptModalOpen(true); }} onDelete={deleteAppt} />
                </div>

                {/* Recent users */}
                <div className="card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="font-semibold text-slate-800">Últimos usuarios creados</h3>
                    <button className="text-sm font-semibold text-sky-600 hover:text-sky-700" onClick={() => setTab('users')}>Ver todos</button>
                  </div>
                  <RecentUsers rows={recentUsers} onEdit={(u) => { setEditingUser(u); setUserModalOpen(true); }} />
                </div>
              </div>
            </div>
          )}

          {tab === 'appointments' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
                <div>
                  <label className="label"><Filter size={14} className="mr-1 inline" /> Filtrar por fecha</label>
                  <input type="date" className="input" value={apptFilter} onChange={(e) => setApptFilter(e.target.value)} />
                </div>
                {apptFilter && <button className="btn-ghost" onClick={() => setApptFilter('')}>Limpiar</button>}
              </div>

              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Paciente</th>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Hora</th>
                      <th className="px-4 py-3">Especialidad</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppts.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400"><Inbox size={24} className="mx-auto mb-2" />Sin turnos.</td></tr>
                    ) : filteredAppts.map((a) => (
                      <tr key={a.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-medium text-slate-800">{fullName(a.patient)}</td>
                        <td className="px-4 py-3 text-slate-600">{fullName(a.doctor)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(a.appointment_date)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatTime(a.appointment_time)}</td>
                        <td className="px-4 py-3 text-slate-600">{a.specialty}</td>
                        <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button className="btn-secondary !px-3 !py-2" onClick={() => { setEditingAppt(a); setApptModalOpen(true); }}><Pencil size={15} /></button>
                            <button className="btn-danger !px-3 !py-2" onClick={() => deleteAppt(a.id)}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
                <div>
                  <label className="label"><Filter size={14} className="mr-1 inline" /> Tipo de usuario</label>
                  <select className="input" value={userFilter} onChange={(e) => setUserFilter(e.target.value as '' | Role)}>
                    <option value="">Todos</option>
                    <option value="admin">Administrador</option>
                    <option value="doctor">Médico</option>
                    <option value="patient">Paciente</option>
                  </select>
                </div>
                {userFilter && <button className="btn-ghost" onClick={() => setUserFilter('')}>Limpiar</button>}
              </div>

              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Mail</th>
                      <th className="px-4 py-3">Tipo de usuario</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400"><Inbox size={24} className="mx-auto mb-2" />Sin usuarios.</td></tr>
                    ) : filteredUsers.map((u) => (
                      <tr key={u.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-medium text-slate-800">{fullName(u)}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{maskEmail(u.email ?? '')}</td>
                        <td className="px-4 py-3">
                          <RoleTag role={u.role} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button className="btn-secondary !px-3 !py-2" onClick={() => { setEditingUser(u); setUserModalOpen(true); }}><Pencil size={15} /></button>
                            {u.id !== profile?.id && (
                              <button className="btn-danger !px-3 !py-2" onClick={() => deleteUser(u.id)}><Trash2 size={15} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <AppointmentModal
        open={apptModalOpen}
        mode={editingAppt ? 'edit' : 'create'}
        doctors={doctors}
        initial={editingAppt ?? undefined}
        allowStatusEdit
        onSave={saveAppt}
        onClose={() => setApptModalOpen(false)}
      />

      <UserModal
        open={userModalOpen}
        user={editingUser}
        onSave={saveUser}
        onClose={() => setUserModalOpen(false)}
      />
    </AppShell>
  );
}

// ---- subcomponents ----

const TONES: Record<string, string> = {
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  blue: 'bg-hmg-blue/10 text-hmg-blue ring-hmg-blue/20',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
};

function KpiCard({ icon: Icon, label, value, tone }: { icon: typeof Activity; label: string; value: number; tone: string }) {
  return (
    <div className="card p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-inset ${TONES[tone]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function RecentAppts({ rows, onEdit, onDelete }: {
  rows: Appointment[];
  onEdit: (a: Appointment) => void;
  onDelete: (id: string) => void;
}) {
  if (rows.length === 0) return <Empty />;
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
          <div className="min-w-[160px] flex-1">
            <p className="font-medium text-slate-800">{fullName(a.patient)}</p>
            <p className="text-xs text-slate-500">{fullName(a.doctor)} · {a.specialty}</p>
          </div>
          <div className="text-sm text-slate-600">{formatDate(a.appointment_date)} · {formatTime(a.appointment_time)}</div>
          <StatusBadge status={a.status} size="sm" />
          <div className="flex gap-2">
            <button className="btn-secondary !px-2.5 !py-1.5" onClick={() => onEdit(a)}><Pencil size={14} /></button>
            <button className="btn-danger !px-2.5 !py-1.5" onClick={() => onDelete(a.id)}><Trash2 size={14} /></button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function RecentUsers({ rows, onEdit }: { rows: Profile[]; onEdit: (u: Profile) => void }) {
  if (rows.length === 0) return <Empty />;
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((u) => (
        <li key={u.id} className="flex items-center gap-3 px-5 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
            {(u.first_name[0] ?? '').toUpperCase()}{(u.last_name[0] ?? '').toUpperCase()}
          </div>
          <div className="min-w-[140px] flex-1">
            <p className="font-medium text-slate-800">{fullName(u)}</p>
            <p className="font-mono text-xs text-slate-500">{maskEmail(u.email ?? '')}</p>
          </div>
          <RoleTag role={u.role} />
          <button className="btn-secondary !px-2.5 !py-1.5" onClick={() => onEdit(u)}><Pencil size={14} /></button>
        </li>
      ))}
    </ul>
  );
}

function Empty() {
  return <div className="grid place-items-center gap-2 py-10 text-slate-400"><Inbox size={22} /><p className="text-sm">Sin datos.</p></div>;
}

function RoleTag({ role }: { role: Role }) {
  const map: Record<Role, { label: string; cls: string }> = {
    admin: { label: 'Administrador', cls: 'bg-hmg-blue/10 text-hmg-blue ring-hmg-blue/20' },
    doctor: { label: 'Médico', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
    patient: { label: 'Paciente', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  };
  const r = map[role];
  return <span className={`badge ring-1 ring-inset ${r.cls}`}>{r.label}</span>;
}

function UserModal({ open, user, onSave, onClose }: {
  open: boolean;
  user: Profile | null;
  onSave: (d: { first_name: string; last_name: string; role: Role }) => Promise<{ error: string | null }>;
  onClose: () => void;
}) {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [role, setRole] = useState<Role>('patient');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      setFirst(user.first_name); setLast(user.last_name); setRole(user.role); setErr(null);
    }
  }, [open, user]);

  const submit = async () => {
    setErr(null);
    if (!first.trim() || !last.trim()) return setErr('Completá nombre y apellido.');
    setSaving(true);
    const { error } = await onSave({ first_name: first, last_name: last, role });
    setSaving(false);
    if (error) setErr(error);
    else onClose();
  };

  return (
    <Modal
      open={open}
      title="Modificar usuario"
      subtitle="Editá los datos del usuario."
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            <Save size={16} /> Guardar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={first} onChange={(e) => setFirst(e.target.value)} />
          </div>
          <div>
            <label className="label">Apellido</label>
            <input className="input" value={last} onChange={(e) => setLast(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Tipo de usuario</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="admin">Administrador</option>
            <option value="doctor">Médico</option>
            <option value="patient">Paciente</option>
          </select>
        </div>
        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{err}</p>}
      </div>
    </Modal>
  );
}
