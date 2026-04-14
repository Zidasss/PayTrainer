import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); setNeedsProfileSetup(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*, trainers(*), subscriptions(*, plans(*))')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
      setNeedsProfileSetup(false);
    } else {
      // OAuth user without profile - needs setup
      setNeedsProfileSetup(true);
      setProfile(null);
    }
    setLoading(false);
  }

  async function setupOAuthProfile({ role, fullName, phone }) {
    if (!session?.user) return;
    const userId = session.user.id;
    const resolvedFullName = fullName || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      role,
      full_name: resolvedFullName,
      phone: phone || null,
      slug: resolvedFullName.toLowerCase().replace(/\s+/g, '-').replace(/\./g, ''),
    });
    if (profileError) throw profileError;

    if (role === 'trainer') {
      await supabase.from('trainers').insert({ id: userId });
    }

    setNeedsProfileSetup(false);
    await fetchProfile(userId);
  }

  async function signUp({ email, password, fullName, role, phone }) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password,
    });
    if (authError) throw authError;

    const userId = authData.user.id;

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId, role, full_name: fullName, phone,
      slug: fullName.toLowerCase().replace(/\s+/g, '-').replace(/\./g, ''),
    });
    if (profileError) throw profileError;

    if (role === 'trainer') {
      await supabase.from('trainers').insert({ id: userId });
    }

    await fetchProfile(userId);
    return authData;
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setNeedsProfileSetup(false);
  }

  return (
    <AuthContext.Provider value={{
      session, profile, loading, needsProfileSetup,
      signUp, signIn, signOut, fetchProfile, setupOAuthProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);