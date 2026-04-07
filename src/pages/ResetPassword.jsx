import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleReset(e) {
    e.preventDefault();
    if (password.length < 6) { setError('A senha deve ter no mínimo 6 caracteres'); return; }
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="animate-in" style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <CheckCircle size={28} color="var(--green-500)" />
          </div>
          <p className="page-title">Senha redefinida!</p>
          <p className="page-subtitle" style={{ marginBottom: 24 }}>Sua senha foi atualizada com sucesso.</p>
          <button className="btn btn-primary" onClick={() => nav('/auth')}>Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', paddingBottom: 40 }}>
      <div className="animate-in" style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--sand-100)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Lock size={28} color="var(--sand-600)" />
        </div>
        <p className="page-title">Nova senha</p>
        <p className="page-subtitle">Escolha uma nova senha para sua conta</p>
      </div>

      <form onSubmit={handleReset}>
        <div className="animate-in delay-1" style={{ marginBottom: 14, position: 'relative' }}>
          <label className="input-label">Nova senha</label>
          <input className="input-field" style={{ paddingRight: 44 }} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
            type={showPw ? 'text' : 'password'} required minLength={6} />
          <div onClick={() => setShowPw(!showPw)}
            style={{ position: 'absolute', right: 12, top: 32, cursor: 'pointer', color: 'var(--sand-400)' }}>
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>

        {error && <p style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <button type="submit" className="btn btn-primary animate-in delay-2" disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} />
            : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  );
}