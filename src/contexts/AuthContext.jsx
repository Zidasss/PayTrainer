import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { callStripe } from '../lib/supabase';

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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('fetchProfile result:', { data, error: error?.message, userId });

      if (data) {
        if (data.role === 'trainer') {
          const { data: trainer } = await supabase
            .from('trainers')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          if (trainer) {
            data.trainers = trainer;
            data.referral_code = trainer.referral_code;
            data.free_fee_until = trainer.free_fee_until;
            data.stripe_onboarding_complete = trainer.stripe_onboarding_complete;
          }
        }

        const { data: subs } = await supabase
          .from('subscriptions')
          .select('*, plans(*)')
          .eq(data.role === 'trainer' ? 'trainer_id' : 'student_id', userId)
          .limit(5);
        if (subs) data.subscriptions = subs;

        setProfile(data);
        setNeedsProfileSetup(false);
      } else {
        setNeedsProfileSetup(true);
        setProfile(null);
      }
      setLoading(false);
    }

  async function setupOAuthProfile({ role, fullName, phone, referralCode }) {
    if (!session?.user) return;
    const userId = session.user.id;
    const resolvedFullName = fullName || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
    const slug = resolvedFullName.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '') + '-' + Math.random().toString(36).substring(2, 6);

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        role,
        full_name: resolvedFullName,
        phone: phone || null,
        slug,
      });
      if (profileError) throw profileError;
    }

    if (role === 'trainer') {
      const { data: existingTrainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingTrainer) {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error: trainerError } = await supabase.from('trainers').insert({
          id: userId,
          referral_code: code,
        });
        if (trainerError) console.log('Trainer insert error:', trainerError);
      }

      if (referralCode) {
        try {
          await callStripe('apply_referral', { referral_code: referralCode });
        } catch (e) {
          console.log('Referral error:', e.message);
        }
      }
    }

    setNeedsProfileSetup(false);
    await fetchProfile(userId);
  }

  async function signUp({ email, password, fullName, role, phone, referralCode }) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password,
    });
    if (authError) throw authError;

    const userId = authData.user.id;
    const slug = fullName.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '') + '-' + Math.random().toString(36).substring(2, 6);

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId, role, full_name: fullName, phone, slug,
    });
    if (profileError) throw profileError;

    if (role === 'trainer') {
      let code;
      let attempts = 0;
      while (attempts < 5) {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: existing } = await supabase
          .from('trainers')
          .select('id')
          .eq('referral_code', code)
          .maybeSingle();
        if (!existing) break;
        attempts++;
      }

      await supabase.from('trainers').upsert({
        id: userId,
        referral_code: code,
      });

      // Apply referral code if provided
      if (referralCode) {
        try {
          await callStripe('apply_referral', { referral_code: referralCode });
        } catch (e) {
          console.log('Referral code error:', e.message);
        }
      }
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