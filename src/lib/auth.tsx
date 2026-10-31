import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, type Profile } from './supabase';

type AuthContextValue = {
  session: import('@supabase/supabase-js').Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: 'student' | 'teacher',
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthContextValue['session']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
      }
      if (!newSession) setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // load + sync profile when session changes
  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (existing) {
        setProfile(existing as Profile);
        setLoading(false);
      } else {
        // profile may not exist for very fresh accounts; sign-up creates it
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password, displayName, role) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    const userId = data.user?.id;
    if (userId) {
      await supabase.from('profiles').insert({
        id: userId,
        display_name: displayName,
        role,
      });
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
