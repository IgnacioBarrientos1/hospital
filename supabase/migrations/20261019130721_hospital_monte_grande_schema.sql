/*
# Hospital Monte Grande - Core schema, security, and seed data

## Purpose
Backs a medical-center web app with three roles (admin, doctor, patient).
Authentication is handled by Supabase Auth (email + password). Passwords are
hashed by Supabase Auth using bcrypt with a per-user salt — never stored in
plaintext. All client/server traffic flows over HTTPS/TLS via the Supabase
endpoint. Emails shown in the UI are masked to honour data protection.

## 1. New Tables
### profiles
- id (uuid, PK, references auth.users CASCADE)
- first_name (text, NOT NULL)
- last_name (text, NOT NULL)
- role (text, NOT NULL) — 'admin' | 'doctor' | 'patient'
- created_at (timestamptz, default now())
### appointments
- id (uuid, PK)
- patient_id (uuid, NOT NULL, references profiles CASCADE)
- doctor_id (uuid, NOT NULL, references profiles CASCADE)
- appointment_date (date, NOT NULL)
- appointment_time (time, NOT NULL)
- specialty (text, NOT NULL)
- notes (text, nullable)
- status (text, NOT NULL, default 'pending') — 'pending' | 'confirmed' | 'cancelled'
- created_at (timestamptz, default now())

## 2. Helper
- public.current_role() — SECURITY DEFINER; returns caller's role from profiles.

## 3. RLS
- profiles: self read/update, admin read/update/delete, self insert.
- appointments: patient sees own, doctor sees assigned, admin sees all;
  patients+admins insert; patient/assigned doctor/admin update; patient/admin delete.

## 4. Seed
Demo users (admin, 2 doctors, patient) with bcrypt-hashed passwords + profiles
+ 2 sample appointments. Idempotent.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  specialty text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_doctor_id_idx ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_appointment_date_idx ON appointments(appointment_date);

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin" ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.current_role() = 'admin');

DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
CREATE POLICY "profiles_update_own_or_admin" ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.current_role() = 'admin')
  WITH CHECK (id = auth.uid() OR public.current_role() = 'admin');

DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE
  TO authenticated
  USING (public.current_role() = 'admin');

DROP POLICY IF EXISTS "appointments_select_role" ON appointments;
CREATE POLICY "appointments_select_role" ON appointments FOR SELECT
  TO authenticated
  USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR public.current_role() = 'admin'
  );

DROP POLICY IF EXISTS "appointments_insert_patient_or_admin" ON appointments;
CREATE POLICY "appointments_insert_patient_or_admin" ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (public.current_role() IN ('patient', 'admin'));

DROP POLICY IF EXISTS "appointments_update_role" ON appointments;
CREATE POLICY "appointments_update_role" ON appointments FOR UPDATE
  TO authenticated
  USING (patient_id = auth.uid() OR doctor_id = auth.uid() OR public.current_role() = 'admin')
  WITH CHECK (patient_id = auth.uid() OR doctor_id = auth.uid() OR public.current_role() = 'admin');

DROP POLICY IF EXISTS "appointments_delete_role" ON appointments;
CREATE POLICY "appointments_delete_role" ON appointments FOR DELETE
  TO authenticated
  USING (patient_id = auth.uid() OR public.current_role() = 'admin');

-- ---------- seed (idempotent) ----------
DO $$
DECLARE
  admin_id   uuid := 'a1a1a1a1-1111-1111-1111-111111111111';
  doctor_id  uuid := 'b2b2b2b2-2222-2222-2222-222222222222';
  doctor2_id uuid := 'c3c3c3c3-3333-3333-3333-333333333333';
  patient_id uuid := 'd4d4d4d4-4444-4444-4444-444444444444';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_id) THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role, raw_app_meta_data, raw_user_meta_data)
    VALUES (admin_id, '00000000-0000-0000-0000-000000000000', 'admin@hmg.com', crypt('admin123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated', '{"role":"admin"}', '{}');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = doctor_id) THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role, raw_app_meta_data, raw_user_meta_data)
    VALUES (doctor_id, '00000000-0000-0000-0000-000000000000', 'doctor@hmg.com', crypt('doctor123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated', '{"role":"doctor"}', '{}');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = doctor2_id) THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role, raw_app_meta_data, raw_user_meta_data)
    VALUES (doctor2_id, '00000000-0000-0000-0000-000000000000', 'doctor2@hmg.com', crypt('doctor123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated', '{"role":"doctor"}', '{}');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = patient_id) THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role, raw_app_meta_data, raw_user_meta_data)
    VALUES (patient_id, '00000000-0000-0000-0000-000000000000', 'patient@hmg.com', crypt('patient123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated', '{"role":"patient"}', '{}');
  END IF;
END $$;

INSERT INTO profiles (id, first_name, last_name, role) VALUES
  ('a1a1a1a1-1111-1111-1111-111111111111', 'Laura', 'González', 'admin'),
  ('b2b2b2b2-2222-2222-2222-222222222222', 'Carlos', 'Pérez', 'doctor'),
  ('c3c3c3c3-3333-3333-3333-333333333333', 'María', 'López', 'doctor'),
  ('d4d4d4d4-4444-4444-4444-444444444444', 'Juan', 'Ruiz', 'patient')
ON CONFLICT (id) DO NOTHING;

INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, specialty, notes, status)
SELECT 'd4d4d4d4-4444-4444-4444-444444444444', 'b2b2b2b2-2222-2222-2222-222222222222', CURRENT_DATE, '09:00', 'Cardiología', 'Control de rutina', 'confirmed'
WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE patient_id = 'd4d4d4d4-4444-4444-4444-444444444444');

INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, specialty, notes, status)
SELECT 'd4d4d4d4-4444-4444-4444-444444444444', 'c3c3c3c3-3333-3333-3333-333333333333', CURRENT_DATE + 3, '11:30', 'Dermatología', NULL, 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM appointments
  WHERE patient_id = 'd4d4d4d4-4444-4444-4444-444444444444' AND doctor_id = 'c3c3c3c3-3333-3333-3333-333333333333'
);
