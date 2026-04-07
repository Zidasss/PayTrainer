import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell } from 'lucide-react';

export default function OAuthSetup() {
  const { session, setupOAuthProfile } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || '';

  async function handleContinue() {
    if (!role) return;
    setLoading(true);
    setError('');
    try {
      await setupOAuthProfile({ role, fullName: userName });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', paddingBottom: 40 }}>
      <div className="animate-in" style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Dumbbell size={28} color="white" />
        </div>
        <p className="page-title">Bem-vindo, {userName}!</p>
        <p className="page-subtitle">Como deseja usar o Stride?</p>
      </div>

      <div className="animate-in delay-1" onClick={() => setRole('student')}
        style={{
          cursor: 'pointer', padding: 20, borderRadius: 'var(--radius-lg)', marginBottom: 12,
          border: role === 'student' ? '2px solid var(--green-400)' : '1.5px solid var(--sand-200)',
          background: role === 'student' ? 'var(--green-50)' : 'white',
          display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.15s',
        }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: role === 'student' ? 'var(--green-100)' : 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22 }}>🏋️</span>
        </div>
        <div>
          <p style={{ fontWeight: 500, fontSize: 16 }}>Sou aluno</p>
          <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 2 }}>Agende aulas e pague online</p>
        </div>
      </div>

      <div className="animate-in delay-2" onClick={() => setRole('trainer')}
        style={{
          cursor: 'pointer', padding: 20, borderRadius: 'var(--radius-lg)', marginBottom: 24,
          border: role === 'trainer' ? '2px solid var(--blue)' : '1.5px solid var(--sand-200)',
          background: role === 'trainer' ? 'var(--blue-bg)' : 'white',
          display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.15s',
        }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: role === 'trainer' ? 'var(--blue-bg)' : 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22 }}>💪</span>
        </div>
        <div>
          <p style={{ fontWeight: 500, fontSize: 16 }}>Sou personal</p>
          <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 2 }}>Gerencie alunos e finanças</p>
        </div>
      </div>

      {error && <p style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}

      <button className="btn btn-primary animate-in delay-3" onClick={handleContinue}
        disabled={!role || loading}
        style={{ opacity: !role || loading ? 0.6 : 1 }}>
        {loading ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} /> : 'Continuar'}
      </button>
    </div>
  );
}