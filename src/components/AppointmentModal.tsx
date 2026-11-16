import { StatusBadge } from './StatusBadge';

interface AppointmentModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  doctors: { id: string; first_name: string; last_name: string }[];
  defaultPatientName?: string;
  initial?: {
    appointment_date?: string;
    appointment_time?: string;
    specialty?: string;
    notes?: string | null;
    doctor_id?: string;
    status?: 'pending' | 'confirmed' | 'cancelled';
  };
  allowStatusEdit?: boolean;
  onSave: (data: {
    doctor_id: string;
    appointment_date: string;
    appointment_time: string;
    specialty: string;
    notes: string | null;
    status: 'pending' | 'confirmed' | 'cancelled';
  }) => Promise<{ error: string | null }>;
  onClose: () => void;
}

import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Loader2 } from 'lucide-react';

export function AppointmentModal({
  open, mode, doctors, initial, allowStatusEdit, onSave, onClose,
}: AppointmentModalProps) {
  const [doctorId, setDoctorId] = useState(initial?.doctor_id ?? '');
  const [date, setDate] = useState(initial?.appointment_date ?? '');
  const [time, setTime] = useState(initial?.appointment_time ?? '');
  const [specialty, setSpecialty] = useState(initial?.specialty ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'cancelled'>(initial?.status ?? 'pending');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDoctorId(initial?.doctor_id ?? '');
      setDate(initial?.appointment_date ?? '');
      setTime(initial?.appointment_time ?? '');
      setSpecialty(initial?.specialty ?? '');
      setNotes(initial?.notes ?? '');
      setStatus(initial?.status ?? 'pending');
      setErr(null);
    }
  }, [open, initial]);

  const today = new Date().toISOString().slice(0, 10);

  const submit = async () => {
    setErr(null);
    if (!doctorId) return setErr('Seleccioná un médico.');
    if (!date) return setErr('Seleccioná una fecha.');
    if (!time) return setErr('Seleccioná una hora.');
    if (!specialty.trim()) return setErr('Ingresá la especialidad / tipo de turno.');
    setSaving(true);
    const { error } = await onSave({
      doctor_id: doctorId,
      appointment_date: date,
      appointment_time: time,
      specialty: specialty.trim(),
      notes: notes.trim() || null,
      status,
    });
    setSaving(false);
    if (error) setErr(error);
    else onClose();
  };

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Crear turno médico' : 'Editar turno médico'}
      subtitle="Completá los datos de la consulta."
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            Guardar turno
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Médico</label>
          <select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">Seleccionar médico…</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fecha</label>
            <input type="date" min={today} className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Hora</label>
            <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Tipo de turno / Especialidad</label>
          <input className="input" placeholder="Ej.: Cardiología, Clínica general…" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
        </div>
        {allowStatusEdit && (
          <div>
            <label className="label">Estado</label>
            <div className="flex gap-2">
              {(['pending', 'confirmed', 'cancelled'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                    status === s ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <StatusBadge status={s} />
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="label">Notas adicionales (opcional)</label>
          <textarea
            className="input min-h-[90px] resize-y"
            placeholder="Aclaraciones previas a la consulta…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{err}</p>}
      </div>
    </Modal>
  );
}
