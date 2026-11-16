import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface SeedUser {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: "admin" | "doctor" | "patient";
}

const SEED: SeedUser[] = [
  { email: "admin@hmg.com",   password: "Monte2026!",  first_name: "Laura",  last_name: "González", role: "admin" },
  { email: "doctor@hmg.com",  password: "Monte2026!",  first_name: "Carlos", last_name: "Pérez",    role: "doctor" },
  { email: "doctor2@hmg.com", password: "Monte2026!",  first_name: "María",  last_name: "López",    role: "doctor" },
  { email: "patient@hmg.com", password: "Monte2026!",  first_name: "Juan",   last_name: "Ruiz",     role: "patient" },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ email: string; status: string; detail?: string }> = [];

    for (const u of SEED) {
      // Check if user already exists
      const { data: existing } = await admin.auth.admin.listUsers();
      const found = existing.users.find((x) => x.email === u.email);

      let userId: string;

      if (found) {
        // Update password + metadata
        const { data, error } = await admin.auth.admin.updateUserById(found.id, {
          password: u.password,
          email_confirm: true,
          user_metadata: { first_name: u.first_name, last_name: u.last_name, role: u.role },
        });
        if (error) {
          results.push({ email: u.email, status: "error", detail: error.message });
          continue;
        }
        userId = data.user.id;
        results.push({ email: u.email, status: "updated" });
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { first_name: u.first_name, last_name: u.last_name, role: u.role },
        });
        if (error) {
          results.push({ email: u.email, status: "error", detail: error.message });
          continue;
        }
        userId = data.user.id;
        results.push({ email: u.email, status: "created" });
      }

      // Upsert profile
      const { error: profileErr } = await admin.from("profiles").upsert({
        id: userId,
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.role,
      });
      if (profileErr) {
        results.push({ email: u.email, status: "profile_error", detail: profileErr.message });
      }
    }

    // Seed a couple of sample appointments for the patient
    const patient = SEED.find((u) => u.role === "patient")!;
    const doc1 = SEED.find((u) => u.email === "doctor@hmg.com")!;
    const doc2 = SEED.find((u) => u.email === "doctor2@hmg.com")!;

    const { data: pUser } = await admin.auth.admin.listUsers();
    const pId = pUser.users.find((x) => x.email === patient.email)?.id;
    const d1Id = pUser.users.find((x) => x.email === doc1.email)?.id;
    const d2Id = pUser.users.find((x) => x.email === doc2.email)?.id;

    if (pId && d1Id) {
      const { data: existing } = await admin.from("appointments")
        .select("id").eq("patient_id", pId).eq("doctor_id", d1Id).maybeSingle();
      if (!existing) {
        await admin.from("appointments").insert({
          patient_id: pId, doctor_id: d1Id,
          appointment_date: new Date().toISOString().slice(0, 10),
          appointment_time: "09:00",
          specialty: "Cardiología", notes: "Control de rutina", status: "confirmed",
        });
      }
    }
    if (pId && d2Id) {
      const { data: existing } = await admin.from("appointments")
        .select("id").eq("patient_id", pId).eq("doctor_id", d2Id).maybeSingle();
      if (!existing) {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        await admin.from("appointments").insert({
          patient_id: pId, doctor_id: d2Id,
          appointment_date: d.toISOString().slice(0, 10),
          appointment_time: "11:30",
          specialty: "Dermatología", notes: null, status: "pending",
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
