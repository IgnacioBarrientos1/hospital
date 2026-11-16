import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile, Role } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  passwordRecovery: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<{ error: string | null }>;
  signUp: (data: { email: string; password: string; first_name: string; last_name: string; role: Role }) => Promise<{ error: string | null; info: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const loadProfile = useCallback(async (uid: string): Promise<{ profile: Profile | null; error: string | null }> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, created_at')
      .eq('id', uid)
      .maybeSingle();
    if (error) {
      setProfile(null);
      return { profile: null, error: error.message };
    }
    const loadedProfile = data as Profile | null;
    setProfile(loadedProfile);
    return { profile: loadedProfile, error: null };
  }, []);

  const ensurePatientProfile = useCallback(async (authUser: User): Promise<{ error: string | null }> => {
    const loaded = await loadProfile(authUser.id);
    if (loaded.error) {
      return { error: `No se pudo cargar tu perfil: ${loaded.error}` };
    }
    if (loaded.profile) return { error: null };

    const metadata = authUser.user_metadata;
    if (
      metadata.role !== 'patient' ||
      typeof metadata.first_name !== 'string' ||
      typeof metadata.last_name !== 'string'
    ) {
      return {
        error: 'Tu cuenta se autenticó, pero todavía no tiene un perfil. Contactá al administrador del centro médico.',
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        first_name: metadata.first_name,
        last_name: metadata.last_name,
        role: 'patient',
      })
      .select('id, first_name, last_name, role, created_at')
      .single();

    if (error) {
      const retry = await loadProfile(authUser.id);
      if (retry.profile) return { error: null };
      return {
        error: `Tu cuenta se autenticó, pero no se pudo crear tu perfil. ${error.message}`,
      };
    }

    setProfile(data as Profile);
    return { error: null };
  }, [loadProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      (async () => {
        if (event === 'PASSWORD_RECOVERY') {
          setPasswordRecovery(true);
        }
        setSession(newSession);
        if (newSession) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    passwordRecovery,
    async signIn(email, password, remember) {
      if (!remember) {
        // ephemeral session: do not persist past tab close
        await supabase.auth.signOut();
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'No se pudo obtener el usuario autenticado.' };
      return ensurePatientProfile(data.user);
    },
    async signUp({ email, password, first_name, last_name, role }) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name, last_name, role } },
      });
      if (error) return { error: error.message, info: null };
      if (data.session && data.user) {
        const profileResult = await ensurePatientProfile(data.user);
        if (profileResult.error) return { ...profileResult, info: null };
      }
      return {
        error: null,
        info: data.session
          ? 'Tu cuenta fue creada. Ya podés ingresar.'
          : 'Tu cuenta fue creada. Confirmá tu correo desde el enlace que te enviamos y después iniciá sesión.',
      };
    },
    async signOut() {
      await supabase.auth.signOut();
      setProfile(null);
    },
    async refreshProfile() {
      if (session?.user?.id) await loadProfile(session.user.id);
    },
    async updatePassword(newPassword) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: error.message };
      setPasswordRecovery(false);
      return { error: null };
    },
    clearPasswordRecovery() {
      setPasswordRecovery(false);
    },
  }), [session, profile, loading, passwordRecovery, loadProfile, ensurePatientProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
