/*
# Allow authenticated users to view doctor profiles

## Why
Patients need to pick a doctor when creating an appointment, but the existing
profiles SELECT policy only allows reading your own profile (or all profiles
if you are admin). As a result, the doctor dropdown in the patient "Nuevo
turno" modal was always empty.

## Change
Add a new SELECT policy on profiles that lets any authenticated user read
rows whose role is 'doctor'. This is read-only and scoped to doctor profiles
only — patient and admin profiles remain restricted to self/admin as before.

## Security
- SELECT only (no insert/update/delete).
- Limited to rows where role = 'doctor'.
- No change to other policies.
*/

DROP POLICY IF EXISTS "profiles_select_doctors" ON profiles;
CREATE POLICY "profiles_select_doctors" ON profiles FOR SELECT
  TO authenticated
  USING (role = 'doctor');
