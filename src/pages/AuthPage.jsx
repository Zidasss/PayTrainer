import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowRight, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';

// Cloudhead logo component
function CloudheadLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ borderRadius: '50%' }}>
      <circle cx="50" cy="50" r="50" fill="#1a1a1a"/>
      <ellipse cx="50" cy="58" rx="28" ry="24" fill="white" stroke="#1a1a1a" strokeWidth="3"/>
      <ellipse cx="50" cy="30" rx="22" ry="18" fill="#1a1a1a"/>
      <ellipse cx="62" cy="22" rx="12" ry="10" fill="#1a1a1a"/>
      <circle cx="68" cy="16" r="4" fill="#1a1a1a"/>
      <circle cx="42" cy="54" r="3.5" fill="#1a1a1a"/>
      <path d="M 38 62 Q 44 67 48 62" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="66" cy="56" rx="5" ry="4.5" fill="#1a1a1a" transform="rotate(-10 66 56)"/>
    </svg>
  );
}

// Stride logo
function StrideLogo({ size = 56 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--green-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
        <path d="M6 4v16m12-16v16M2 8h4m12 0h4M2 16h4m12 0h4"/>
      </svg>
    </div>
  );
}

export default function AuthPage() {
  const { signIn, signUp, session, profile } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'signup' ? 'signup' : params.get('mode') === 'forgot' ? 'forgot' : 'login';
  });
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

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
        if (redirect) { sessionStorage.removeItem('joinRedirect'); setTimeout(() => nav(redirect), 500); }
      } else if (mode === 'signup') {
        if (!role) { setError('Selecione seu perfil'); setLoading(false); return; }
        await signUp({ ...form, role });
        const redirect = sessionStorage.getItem('joinRedirect');
        if (redirect) { sessionStorage.removeItem('joinRedirect'); setTimeout(() => nav(redirect), 500); }
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : err.message);
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
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setSocialLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
    } catch (err) { setError(err.message); setSocialLoading(false); }
  }

  const hasJoinRedirect = !!sessionStorage.getItem('joinRedirect');

  function GoogleButton({ label }) {
    return (
      <button onClick={handleGoogleLogin} disabled={socialLoading}
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--sand-200)', background: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontSize: 14, fontWeight: 500, color: 'var(--green-900)', fontFamily: 'var(--font-body)',
          opacity: socialLoading ? 0.6 : 1, transition: 'all 0.15s',
        }}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {label || 'Continuar com Google'}
      </button>
    );
  }

  function Divider() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--sand-200)' }} />
        <span style={{ fontSize: 12, color: 'var(--sand-400)' }}>ou</span>
        <div style={{ flex: 1, height: 1, background: 'var(--sand-200)' }} />
      </div>
    );
  }

  function BackButton({ to }) {
    return (
      <div className="animate-in" onClick={() => typeof to === 'function' ? to() : nav(to || '/')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--sand-500)', marginBottom: 20, padding: '8px 0' }}>
        <ArrowLeft size={18} />
        <span style={{ fontSize: 14 }}>Voltar</span>
      </div>
    );
  }

  function PoweredBy() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28, opacity: 0.6 }}>
        <img src="/cloudhead-logo.svg" alt="Cloudhead" style={{ width: 22, height: 22, borderRadius: '50%' }} />
        <span style={{ fontSize: 11, color: 'var(--sand-400)' }}>por Cloudhead</span>
      </div>
    );
  }

  // ─── Forgot password ───
  if (mode === 'forgot') {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', paddingBottom: 40 }}>
        <BackButton to={() => setMode('login')} />
        <div className="animate-in" style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--sand-100)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Mail size={28} color="var(--sand-600)" />
          </div>
          <p className="page-title">{resetSent ? 'Email enviado!' : 'Esqueceu sua senha?'}</p>
          <p className="page-subtitle" style={{ marginTop: 4, lineHeight: 1.5 }}>
            {resetSent ? 'Verifique sua caixa de entrada e siga as instruções.' : 'Digite seu email para receber o link de recuperação.'}
          </p>
        </div>

        {!resetSent ? (
          <form onSubmit={handleResetPassword}>
            <div className="animate-in delay-1" style={{ marginBottom: 14 }}>
              <label className="input-label">Email</label>
              <input className="input-field" value={form.email} onChange={set('email')} placeholder="seu@email.com" type="email" required />
            </div>
            {error && <p style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button type="submit" className="btn btn-primary animate-in delay-2" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} /> : 'Enviar link de recuperação'}
            </button>
          </form>
        ) : (
          <button className="btn btn-primary animate-in delay-1" onClick={() => { setMode('login'); setResetSent(false); }}>Voltar para o login</button>
        )}
        <PoweredBy />
      </div>
    );
  }

  // ─── Role selection ───
  if (mode === 'signup' && !role) {
    if (hasJoinRedirect) { setRole('student'); return null; }

    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', paddingBottom: 40 }}>
        <BackButton to="/" />
        <div className="animate-in">
          <p className="page-title">Como deseja usar o Stride?</p>
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
        <PoweredBy />
      </div>
    );
  }

  // ─── Login / Signup form ───
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', paddingBottom: 40 }}>
      <BackButton to={mode === 'signup' ? () => { setRole(null); setMode('signup'); } : '/'} />

      <div className="animate-in" style={{ textAlign: 'center', marginBottom: 28 }}>
        <StrideLogo />
        <p className="page-title" style={{ marginTop: 16 }}>Stride</p>
        <p className="page-subtitle">
          {mode === 'login' ? 'Entre na sua conta' : `Crie sua conta${hasJoinRedirect ? ' de aluno' : ''}`}
        </p>
      </div>

      <div className="animate-in delay-1">
        <GoogleButton label={mode === 'login' ? 'Entrar com Google' : 'Cadastrar com Google'} />
        <Divider />
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
          <div onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: 32, cursor: 'pointer', color: 'var(--sand-400)' }}>
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>

        {mode === 'login' && (
          <div className="animate-in delay-3" style={{ textAlign: 'right', marginBottom: 4 }}>
            <span onClick={() => setMode('forgot')} style={{ fontSize: 13, color: 'var(--green-500)', cursor: 'pointer' }}>Esqueceu sua senha?</span>
          </div>
        )}

        {error && <p style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12, marginTop: 8 }}>{error}</p>}

        <button type="submit" className="btn btn-primary animate-in delay-4" disabled={loading} style={{ marginTop: 12, opacity: loading ? 0.7 : 1 }}>
          {loading ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} /> : <>{mode === 'login' ? 'Entrar' : 'Criar conta'} <ArrowRight size={18} /></>}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--sand-500)', marginTop: 20 }}>
        {mode === 'login' ? (
          <>Não tem conta? <span onClick={() => setMode('signup')} style={{ color: 'var(--green-500)', fontWeight: 500, cursor: 'pointer' }}>Cadastre-se</span></>
        ) : (
          <>Já tem conta? <span onClick={() => { setMode('login'); setRole(null); }} style={{ color: 'var(--green-500)', fontWeight: 500, cursor: 'pointer' }}>Entrar</span></>
        )}
      </p>
      <PoweredBy />
    </div>
  );
}