import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { HeartPulse, Lock, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

export function ResetPasswordPage() {
  const { updatePassword, clearPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      setError(translateError(error));
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-sky-50 via-white to-sky-100 px-4">
        <div className="card w-full max-w-md p-8 text-center animate-scale-in">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Contraseña actualizada</h2>
          <p className="mt-2 text-sm text-slate-500">
            Tu nueva contraseña fue guardada correctamente. Ya podés iniciar sesión con ella.
          </p>
          <button onClick={clearPasswordRecovery} className="btn-primary mt-6 w-full">
            Ir a iniciar sesión <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-sky-100">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="relative grid min-h-screen place-items-center px-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="card p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-hmg-blue text-white">
                <HeartPulse size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-hmg-deep">Hospital Monte Grande</p>
                <p className="text-xs text-slate-500">Restablecer contraseña</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900">Nueva contraseña</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingresá tu nueva contraseña para volver a acceder a tu cuenta.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="label">Nueva contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    className="input pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Mínimo 6 caracteres. Evitá contraseñas comunes que aparezcan en filtraciones conocidas.
                </p>
              </div>

              <div>
                <label className="label">Confirmar contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    className="input pl-9"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
              )}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                Guardar nueva contraseña
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('weak') || m.includes('easy to guess') || m.includes('known to be weak')) {
    return 'Esa contraseña aparece en bases de datos de filtraciones conocidas y no es aceptada. Probá con una combinación más original (ej.: "CieloMonte2026!").';
  }
  if (m.includes('password') && m.includes('at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  return msg;
}
