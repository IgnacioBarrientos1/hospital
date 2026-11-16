import { useEffect, useMemo, useState } from 'react';
import { supabase, Appointment } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { formatDate, formatTime, fullName } from '@/lib/format';
import { CalendarDays, Filter, Inbox, Loader2 } from 'lucide-react';

export function DoctorPage() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>('');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    let q = supabase
      .from('appointments')
      .select('*, patient:profiles!appointments_patient_id_fkey(*)')
      .eq('doctor_id', profile.id)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    if (filterDate) q = q.eq('appointment_date', filterDate);
    q.then(({ data, error }) => {
      if (!error && data) setAppointments(data as Appointment[]);
      setLoading(false);
    });
  }, [profile, filterDate]);

  const sorted = useMemo(() => appointments, [appointments]);

  return (
    <AppShell
      title="Mis turnos asignados"
      actions={
        <button className="btn-secondary" onClick={() => setShowFilter((s) => !s)}>
          <Filter size={16} />
          Filtrar por fecha
        </button>
      }
    >
      {showFilter && (
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm animate-fade-in">
          <div>
            <label className="label">Fecha</label>
            <input type="date" className="input" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          {filterDate && (
            <button className="btn-ghost" onClick={() => setFilterDate('')}>Limpiar filtro</button>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div>Fecha</div>
          <div>Paciente</div>
        </div>
        {loading ? (
          <div className="grid place-items-center py-16 text-slate-400">
            <Loader2 className="animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="grid place-items-center gap-2 py-16 text-slate-400">
            <Inbox size={28} />
            <p className="text-sm">No tenés turnos{filterDate ? ' para esta fecha' : ''}.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sorted.map((a) => (
              <li key={a.id} className="grid grid-cols-2 items-center px-5 py-4 transition-colors hover:bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-600">
                    <CalendarDays size={18} />
                  </div>
                  <div className="leading-tight">
                    <p className="font-medium text-slate-800">{formatDate(a.appointment_date)}</p>
                    <p className="text-sm text-slate-500">{formatTime(a.appointment_time)}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-slate-800">{fullName(a.patient)}</p>
                  <p className="text-sm text-slate-500">{a.specialty}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
