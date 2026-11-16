import { useCallback, useEffect, useState } from 'react';
import { supabase, Appointment, Profile } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { AppointmentModal } from '@/components/AppointmentModal';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatTime, fullName } from '@/lib/format';
import { Plus, Pencil, Trash2, CalendarDays, Inbox, Loader2, AlertCircle } from 'lucide-react';

export function PatientPage() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*, doctor:profiles!appointments_doctor_id_fkey(*), patient:profiles!appointments_patient_id_fkey(*)')
      .eq('patient_id', profile.id)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    if (error) setError(error.message);
    else setAppointments((data ?? []) as Appointment[]);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .eq('role', 'doctor')
      .order('last_name')
      .then(({ data }) => data && setDoctors(data as Profile[]));
    load();
  }, [load]);

  const handleSave = async (data: {
    doctor_id: string;
    appointment_date: string;
    appointment_time: string;
    specialty: string;
    notes: string | null;
    status: 'pending' | 'confirmed' | 'cancelled';
  }) => {
    if (!profile) return { error: 'No hay sesión.' };
    if (editing) {
      const { error } = await supabase
        .from('appointments')
        .update({
          doctor_id: data.doctor_id,
          appointment_date: data.appointment_date,
          appointment_time: data.appointment_time,
          specialty: data.specialty,
          notes: data.notes,
        })
        .eq('id', editing.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from('appointments').insert({
        patient_id: profile.id,
        doctor_id: data.doctor_id,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        specialty: data.specialty,
        notes: data.notes,
        status: 'pending',
      });
      if (error) return { error: error.message };
    }
    await load();
    return { error: null };
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este turno?')) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) { setError(error.message); return; }
    await load();
  };

  return (
    <AppShell
      title="Gestión de agenda y turnos"
      actions={
        <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={16} />
          Nuevo turno
        </button>
      }
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="hidden grid-cols-4 border-b border-slate-100 bg-slate-50/60 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
          <div>Fecha</div>
          <div>Doctor</div>
          <div>Estado</div>
          <div className="text-right">Acción</div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16 text-slate-400">
            <Loader2 className="animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="grid place-items-center gap-2 py-16 text-slate-400">
            <Inbox size={28} />
            <p className="text-sm">No tenés turnos todavía.</p>
            <button className="btn-primary mt-2" onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus size={16} /> Solicitar primer turno
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {appointments.map((a) => (
              <li key={a.id} className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60 sm:grid-cols-4 sm:items-center">
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
                  <p className="font-medium text-slate-800">{fullName(a.doctor)}</p>
                  <p className="text-sm text-slate-500">{a.specialty}</p>
                </div>
                <div><StatusBadge status={a.status} /></div>
                <div className="flex gap-2 sm:justify-end">
                  <button className="btn-secondary !px-3 !py-2" onClick={() => { setEditing(a); setModalOpen(true); }}>
                    <Pencil size={15} /> Editar
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(a.id)}>
                    <Trash2 size={15} /> Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AppointmentModal
        open={modalOpen}
        mode={editing ? 'edit' : 'create'}
        doctors={doctors}
        initial={editing ?? undefined}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />
    </AppShell>
  );
}
