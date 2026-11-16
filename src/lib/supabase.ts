import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Role = 'admin' | 'doctor' | 'patient';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: Role;
  email?: string;
  created_at?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  specialty: string;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  patient?: Profile;
  doctor?: Profile;
}

export interface AppointmentInput {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  specialty: string;
  notes?: string | null;
  status?: 'pending' | 'confirmed' | 'cancelled';
}
