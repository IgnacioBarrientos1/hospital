import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { HeartPulse, Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (mode === 'reset') {
      if (!email) return setError('Ingresá tu correo electrónico.');
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      setLoading(false);
      if (error) {
        setError(translateError(error.message)); setInfo(null);
      } else {
        setInfo('Te enviamos un correo con el enlace para restablecer tu contraseña. Revisá tu casilla (incluida la carpeta de spam).');
        setError(null);
      }
      return;
    }

    if (!email || !password) return setError('Completá correo y contraseña.');

    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(email.trim(), password, remember);
      if (error) setError(translateError(error));
    } else {
      if (!firstName.trim() || !lastName.trim()) {
        setLoading(false);
        return setError('Completá nombre y apellido.');
      }
      const { error, info: signupInfo } = await signUp({
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: 'patient',
      });
      if (error) setError(translateError(error));
      else setInfo(signupInfo);
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-sky-100">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-hmg-blue/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-8 px-4 py-10 lg:flex-row lg:justify-between">
        {/* Brand panel */}
        <div className="hidden max-w-md lg:block">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-hmg-blue text-white shadow-lg shadow-hmg-blue/30">
              <HeartPulse size={24} />
            </div>
            <div>
              <p className="text-xl font-bold text-hmg-deep">Hospital Monte Grande</p>
              <p className="text-sm text-slate-500">Centro médico de alta complejidad</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-hmg-deep">
            Tu salud,<br />
            <span className="text-sky-500">cuidada con precisión.</span>
          </h1>
          <p className="mt-4 text-slate-600">
            Gestión de turnos, agenda médica y administración en una plataforma
            segura diseñada para pacientes, médicos y administradores.
          </p>
          <div className="mt-8 space-y-3">
            {[
              'Turnos en línea en pochi clics',
              'Agenda en tiempo real para médicos',
              'Panel de control para administración',
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 text-slate-700">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-100 text-sky-600">
                  <ShieldCheck size={14} />
                </span>
                <span className="text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auth card */}
        <div className="w-full max-w-md animate-fade-in">
          <div className="card p-8">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-hmg-blue text-white">
                <HeartPulse size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-hmg-deep">Hospital Monte Grande</p>
                <p className="text-xs text-slate-500">Centro médico</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900">
              {mode === 'login' ? 'Iniciar sesión' : mode === 'signup' ? 'Crear cuenta' : 'Recuperar contraseña'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'login'
                ? 'Accedé con tu cuenta para gestionar turnos.'
                : mode === 'signup'
                ? 'Registrate para solicitar tu primer turno.'
                : 'Ingresá tu correo y te enviaremos un enlace para restablecerla.'}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === 'reset' && (
                <button type="button" onClick={() => { setMode('login'); setError(null); setInfo(null); }} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
                  <ArrowLeft size={15} /> Volver a iniciar sesión
                </button>
              )}
              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nombre</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="input pl-9" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="María" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Apellido</label>
                    <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="López" />
                  </div>
                </div>
              )}

              <div>
                <label className="label">Correo electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    className="input pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@correo.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <label className="label">Contraseña</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      className="input pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                    />
                  </div>
                  {mode === 'signup' && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      Mínimo 6 caracteres. Evitá contraseñas comunes (como "Password123") porque el sistema rechaza contraseñas que aparecen en filtraciones conocidas.
                    </p>
                  )}
                </div>
              )}

              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-200"
                    />
                    Recordarme en este dispositivo
                  </label>
                  <button type="button" onClick={() => { setMode('reset'); setError(null); setInfo(null); }} className="text-sm font-semibold text-sky-600 hover:text-sky-700">
                    Recuperar contraseña
                  </button>
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
              )}
              {info && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>
              )}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                {mode === 'login' ? 'Ingresar' : mode === 'signup' ? 'Crear cuenta' : 'Enviar enlace'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="mt-6 rounded-xl bg-sky-50/70 px-4 py-3 text-center text-sm text-slate-600">
              {mode === 'login' ? (
                <>
                  ¿No tenés cuenta?{' '}
                  <button onClick={() => { setMode('signup'); setError(null); setInfo(null); }} className="font-semibold text-sky-600 hover:text-sky-700">
                    Registrate
                  </button>
                </>
              ) : mode === 'signup' ? (
                <>
                  ¿Ya tenés cuenta?{' '}
                  <button onClick={() => { setMode('login'); setError(null); setInfo(null); }} className="font-semibold text-sky-600 hover:text-sky-700">
                    Iniciar sesión
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Conexión segura · Credenciales cifradas · HTTPS/TLS
          </p>
          <div className="mt-3 rounded-lg border border-slate-200/70 bg-white/60 px-3 py-2 text-center text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Demo:</span> admin@hmg.com · doctor@hmg.com · patient@hmg.com — contraseña: Monte2026!
          </div>
        </div>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Tu correo aún no fue confirmado.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ya existe una cuenta con ese correo.';
  if (m.includes('weak') || m.includes('easy to guess') || m.includes('known to be weak')) {
    return 'Esa contraseña aparece en bases de datos de filtraciones conocidas y no es aceptada. Probá con una combinación más original, por ejemplo tres palabras al azar seguidas de un símbolo y un número (ej.: "CieloMonte2026!").';
  }
  if (m.includes('password') && m.includes('at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  return msg;
}
