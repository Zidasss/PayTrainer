import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatPhone, isValidPhone } from '../lib/validation';
import { Dumbbell, ArrowRight } from 'lucide-react';

export default function OAuthSetup() {
  const { session, setupOAuthProfile } = useAuth();
  const [step, setStep] = useState('role'); // 'role' | 'phone'
  const [role, setRole] = useState(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || '';

  async function handleContinue() {
    if (step === 'role') {
      if (!role) return;
      setStep('phone');
      return;
    }

    // Step: phone
    if (phone && !isValidPhone(phone)) {
      setError('Telefone inválido. Use o formato (11) 99999-9999');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await setupOAuthProfile({ role, fullName: userName, phone: phone || null });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  // ─── Role selection ───
  if (step === 'role') {
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
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22 }}>💪</span>
          </div>
          <div>
            <p style={{ fontWeight: 500, fontSize: 16 }}>Sou personal</p>
            <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 2 }}>Gerencie alunos e finanças</p>
          </div>
        </div>

        <div className="animate-in delay-3" style={{ display: 'flex', alignItems: 'flex-Zapt', gap: 10, marginBottom: 16 }}>
          <div onClick={() => setAcceptedTerms(!acceptedTerms)}
            style={{ width: 20, height: 20, borderRadius: 4, border: acceptedTerms ? 'none' : '1.5px solid var(--sand-300)', background: acceptedTerms ? 'var(--green-500)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}>
            {acceptedTerms && <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>✓</span>}
          </div>
          <p style={{ fontSize: 12, color: 'var(--sand-500)', lineHeight: 1.5 }}>
            Li e concordo com os{' '}
            <span onClick={() => window.open('/legal?tab=terms', '_blank')} style={{ color: 'var(--green-500)', cursor: 'pointer', textDecoration: 'underline' }}>Termos de Uso</span>
            {' '}e a{' '}
            <span onClick={() => window.open('/legal?tab=privacy', '_blank')} style={{ color: 'var(--green-500)', cursor: 'pointer', textDecoration: 'underline' }}>Política de Privacidade</span>
          </p>
        </div>

        <button className="btn btn-primary animate-in delay-3" onClick={handleContinue}
          disabled={!role || !acceptedTerms} style={{ opacity: !role || !acceptedTerms ? 0.6 : 1 }}>
          Continuar <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // ─── Phone collection ───
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', paddingBottom: 40 }}>
      <div className="animate-in" style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Dumbbell size={28} color="white" />
        </div>
        <p className="page-title">Quase lá!</p>
        <p className="page-subtitle">Adicione seu telefone para facilitar o contato</p>
      </div>

      <div className="animate-in delay-1" style={{ marginBottom: 20 }}>
        <label className="input-label">Telefone (recomendado)</label>
        <input className="input-field" value={phone}
          onChange={e => setPhone(formatPhone(e.target.value))}
          placeholder="(11) 99999-9999" type="tel" />
        <p style={{ fontSize: 12, color: 'var(--sand-400)', marginTop: 6 }}>
          Seu {role === 'trainer' ? 'aluno' : 'personal'} poderá ver este número para contato.
        </p>
      </div>

      {error && <p style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <button className="btn btn-primary animate-in delay-2" onClick={handleContinue}
        disabled={loading} style={{ opacity: loading ? 0.6 : 1, marginBottom: 10 }}>
        {loading ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} />
          : <>{phone ? 'Continuar' : 'Pular por enquanto'} <ArrowRight size={18} /></>}
      </button>
    </div>
  );
}