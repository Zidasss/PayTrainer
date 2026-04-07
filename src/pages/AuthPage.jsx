import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Dumbbell, ArrowRight, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp, session, profile } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState(() => {
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === 'signup' ? 'signup' : 'login';
  });
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (session && profile) {
      const redirect = sessionStorage.getItem('joinRedirect');
      if (redirect) {
        sessionStorage.removeItem('joinRedirect');
        nav(redirect);
      }
    }
  }, [session, profile]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn({ email: form.email, password: form.password });
        const redirect = sessionStorage.getItem('joinRedirect');
        if (redirect) {
          sessionStorage.removeItem('joinRedirect');
          setTimeout(() => nav(redirect), 500);
        }
      } else if (mode === 'signup') {
        if (!role) { setError('Selecione seu perfil'); setLoading(false); return; }
        await signUp({ ...form, role });
        const redirect = sessionStorage.getItem('joinRedirect');
        if (redirect) {
          sessionStorage.removeItem('joinRedirect');
          setTimeout(() => nav(redirect), 500);
        }
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos'
        : err.message);
    }
    setLoading(false);
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!form.email) { setError('Digite seu email'); return; }
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  const hasJoinRedirect = !!sessionStorage.getItem('joinRedirect');

  // ─── Forgot password ───
  if (mode === 'forgot') {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', paddingBottom: 40 }}>
        <div className="animate-in" style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--sand-100)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Mail size={28} color="var(--sand-600)" />
          </div>
          <p className="page-title">{resetSent ? 'Email enviado!' : 'Esqueceu sua senha?'}</p>
          <p className="page-subtitle" style={{ marginTop: 4, lineHeight: 1.5 }}>
            {resetSent
              ? 'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.'
              : 'Digite seu email e enviaremos um link para redefinir sua senha.'}
          </p>
        </div>

        {!resetSent ? (
          <form onSubmit={handleResetPassword}>
            <div className="animate-in delay-1" style={{ marginBottom: 14 }}>
              <label className="input-label">Email</label>
              <input className="input-field" value={form.email} onChange={set('email')} placeholder="seu@email.com" type="email" required />
            </div>

            {error && <p style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <button type="submit" className="btn btn-primary animate-in delay-2" disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} />
                : 'Enviar link de recuperação'}
            </button>
          </form>
        ) : (
          <button className="btn btn-primary animate-in delay-1" onClick={() => { setMode('login'); setResetSent(false); }}>
            Voltar para o login
          </button>
        )}

        {!resetSent && (
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--sand-500)', marginTop: 20 }}>
            <span onClick={() => setMode('login')} style={{ color: 'var(--green-500)', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} /> Voltar ao login
            </span>
          </p>
        )}
      </div>
    );
  }

  // ─── Role selection for signup ───
  if (mode === 'signup' && !role) {
    if (hasJoinRedirect) {
      setRole('student');
      return null;
    }

    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', paddingBottom: 40 }}>
        <div className="animate-in">
          <p className="page-title">Como deseja usar o FitAgenda?</p>
          <p className="page-subtitle" style={{ marginBottom: 28 }}>Selecione seu perfil</p>
        </div>

        <div className="animate-in delay-1" onClick={() => setRole('student')}
          style={{ cursor: 'pointer', padding: 20, borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--sand-200)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22 }}>🏋️</span>
          </div>
          <div>
            <p style={{ fontWeight: 500, fontSize: 16 }}>Sou aluno</p>
            <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 2 }}>Agende aulas e pague online</p>
          </div>
        </div>

        <div className="animate-in delay-2" onClick={() => setRole('trainer')}
          style={{ cursor: 'pointer', padding: 20, borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--sand-200)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22 }}>💪</span>
          </div>
          <div>
            <p style={{ fontWeight: 500, fontSize: 16 }}>Sou personal</p>
            <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 2 }}>Gerencie alunos e finanças</p>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--sand-500)' }}>
          Já tem conta? <span onClick={() => setMode('login')} style={{ color: 'var(--green-500)', fontWeight: 500, cursor: 'pointer' }}>Entrar</span>
        </p>
      </div>
    );
  }

  // ─── Login / Signup form ───
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', paddingBottom: 40 }}>
      <div className="animate-in" style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Dumbbell size={28} color="white" />
        </div>
        <p className="page-title">FitAgenda</p>
        <p className="page-subtitle">
          {mode === 'login' ? 'Entre na sua conta' : `Crie sua conta${hasJoinRedirect ? ' de aluno' : ''}`}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <>
            <div className="animate-in delay-1" style={{ marginBottom: 14 }}>
              <label className="input-label">Nome completo</label>
              <input className="input-field" value={form.fullName} onChange={set('fullName')} placeholder="Seu nome" required />
            </div>
            <div className="animate-in delay-1" style={{ marginBottom: 14 }}>
              <label className="input-label">Telefone</label>
              <input className="input-field" value={form.phone} onChange={set('phone')} placeholder="(11) 99999-9999" type="tel" />
            </div>
          </>
        )}

        <div className="animate-in delay-2" style={{ marginBottom: 14 }}>
          <label className="input-label">Email</label>
          <input className="input-field" value={form.email} onChange={set('email')} placeholder="seu@email.com" type="email" required />
        </div>

        <div className="animate-in delay-3" style={{ marginBottom: 8, position: 'relative' }}>
          <label className="input-label">Senha</label>
          <input className="input-field" style={{ paddingRight: 44 }} value={form.password} onChange={set('password')}
            placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'Sua senha'} type={showPw ? 'text' : 'password'} required minLength={6} />
          <div onClick={() => setShowPw(!showPw)}
            style={{ position: 'absolute', right: 12, top: 32, cursor: 'pointer', color: 'var(--sand-400)' }}>
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>

        {mode === 'login' && (
          <div className="animate-in delay-3" style={{ textAlign: 'right', marginBottom: 4 }}>
            <span onClick={() => setMode('forgot')} style={{ fontSize: 13, color: 'var(--green-500)', cursor: 'pointer' }}>
              Esqueceu sua senha?
            </span>
          </div>
        )}

        {error && <p style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12, marginTop: 8 }}>{error}</p>}

        <button type="submit" className="btn btn-primary animate-in delay-4" disabled={loading}
          style={{ marginTop: 12, opacity: loading ? 0.7 : 1 }}>
          {loading ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} />
            : <>{mode === 'login' ? 'Entrar' : 'Criar conta'} <ArrowRight size={18} /></>}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--sand-500)', marginTop: 20 }}>
        {mode === 'login' ? (
          <>Não tem conta? <span onClick={() => setMode('signup')} style={{ color: 'var(--green-500)', fontWeight: 500, cursor: 'pointer' }}>Cadastre-se</span></>
        ) : (
          <>Já tem conta? <span onClick={() => { setMode('login'); setRole(null); }} style={{ color: 'var(--green-500)', fontWeight: 500, cursor: 'pointer' }}>Entrar</span></>
        )}
      </p>
    </div>
  );
}