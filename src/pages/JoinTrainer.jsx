import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatBRL } from '../components/Shared';
import { Dumbbell, Check, MapPin, Copy, Share2 } from 'lucide-react';

export default function JoinTrainer() {
  const { trainerId } = useParams();
  const { profile, session, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading) loadTrainer();
  }, [authLoading]);

  async function loadTrainer() {
    const { data: trainerProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', trainerId)
      .eq('role', 'trainer')
      .single();

    setTrainer(trainerProfile);

    const { data: trainerPlans } = await supabase
      .from('plans')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('active', true)
      .order('sessions_per_week');

    setPlans(trainerPlans || []);
    setLoading(false);
  }

  async function handleSelectPlan() {
    if (!selectedPlan || !profile) return;
    setSubscribing(true);

    try {
      // Create subscription record (payment pending)
      const { error: subError } = await supabase.from('subscriptions').upsert({
        student_id: profile.id,
        trainer_id: trainerId,
        plan_id: selectedPlan,
        preferred_location: location || null,
        status: 'active',
      }, { onConflict: 'student_id,trainer_id' });

      if (subError) throw subError;

      // Redirect to payment page to configure card
      nav('/student/payment?setup=true');
    } catch (err) {
      alert('Erro: ' + err.message);
      setSubscribing(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareLink() {
    if (navigator.share) {
      navigator.share({
        title: `Treine com ${trainer?.full_name}`,
        text: `Agende suas aulas com ${trainer?.full_name} pelo Stride!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      copyLink();
    }
  }

  if (loading || authLoading) return <div className="page"><div className="loading-screen"><div className="spinner" /></div></div>;

  if (!trainer) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Personal não encontrado</p>
        <p style={{ fontSize: 14, color: 'var(--sand-500)' }}>O link pode estar incorreto ou expirado</p>
      </div>
    </div>
  );

  // ─── TRAINER viewing their own link ───
  if (profile && profile.role === 'trainer' && profile.id === trainerId) {
    return (
      <div className="page" style={{ paddingBottom: 40 }}>
        <div className="animate-in" style={{ textAlign: 'center', paddingTop: 48, marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Dumbbell size={32} color="var(--green-500)" />
          </div>
          <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Este é o seu link de convite!</p>
          <p style={{ fontSize: 14, color: 'var(--sand-500)', marginTop: 8, lineHeight: 1.5, padding: '0 20px' }}>
            Compartilhe este link com seus alunos para que eles possam escolher um plano e agendar aulas com você.
          </p>
        </div>

        <div className="animate-in delay-1" style={{ background: 'var(--sand-50)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--sand-500)', marginBottom: 6 }}>Link de convite</p>
          <p style={{ fontSize: 13, color: 'var(--green-800)', wordBreak: 'break-all' }}>{window.location.href}</p>
        </div>

        <div className="animate-in delay-2" style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={shareLink}>
            <Share2 size={18} /> Compartilhar
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={copyLink}>
            <Copy size={18} /> {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        {plans.length > 0 && (
          <div className="animate-in delay-3">
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 10, color: 'var(--sand-500)' }}>Seus alunos verão estes planos:</p>
            {plans.map(plan => (
              <div key={plan.id} style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--sand-200)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 14 }}>{plan.name}</p>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{formatBRL(plan.price_cents)}/mês</p>
              </div>
            ))}
          </div>
        )}

        {plans.length === 0 && (
          <div className="animate-in delay-3" style={{ background: 'var(--coral-bg)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--coral)' }}>Nenhum plano criado ainda</p>
            <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 4 }}>Crie seus planos antes de compartilhar o link</p>
          </div>
        )}

        <button className="btn btn-ghost animate-in delay-4" style={{ marginTop: 20 }} onClick={() => nav('/trainer')}>
          ← Voltar para o painel
        </button>
      </div>
    );
  }

  // ─── TRAINER viewing another trainer's link ───
  if (profile && profile.role === 'trainer' && profile.id !== trainerId) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Você está logado como personal</p>
          <p style={{ fontSize: 14, color: 'var(--sand-500)', marginBottom: 20 }}>Para assinar como aluno, saia da sua conta e crie uma conta de aluno.</p>
          <button className="btn btn-outline" onClick={() => nav('/trainer')}>Voltar ao painel</button>
        </div>
      </div>
    );
  }

  // ─── NOT LOGGED IN ───
  if (!session) {
    return (
      <div className="page" style={{ paddingBottom: 40 }}>
        <div className="animate-in" style={{ textAlign: 'center', paddingTop: 32, marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Dumbbell size={32} color="var(--green-500)" />
          </div>
          <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{trainer.full_name}</p>
          <p style={{ fontSize: 14, color: 'var(--sand-500)', marginTop: 4 }}>Personal Trainer</p>
        </div>

        <div className="animate-in delay-1">
          <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>Planos disponíveis</p>
          {plans.map(plan => (
            <div key={plan.id} style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--sand-200)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 500 }}>{plan.name}</p>
                {plan.description && <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 2 }}>{plan.description}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{formatBRL(plan.price_cents)}</p>
                <p style={{ fontSize: 11, color: 'var(--sand-400)' }}>/mês</p>
              </div>
            </div>
          ))}
        </div>

        <div className="animate-in delay-2" style={{ marginTop: 24 }}>
          <button className="btn btn-primary" onClick={() => {
            sessionStorage.setItem('joinRedirect', window.location.pathname);
            nav('/');
          }}>
            Criar conta e assinar
          </button>
          <p style={{ fontSize: 13, color: 'var(--sand-500)', textAlign: 'center', marginTop: 12 }}>
            Já tem conta?{' '}
            <span onClick={() => {
              sessionStorage.setItem('joinRedirect', window.location.pathname);
              nav('/');
            }} style={{ color: 'var(--green-500)', fontWeight: 500, cursor: 'pointer' }}>Entrar</span>
          </p>
        </div>
      </div>
    );
  }

  // ─── STUDENT: pick plan then go to payment ───
  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <div className="animate-in" style={{ textAlign: 'center', paddingTop: 32, marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Dumbbell size={32} color="var(--green-500)" />
        </div>
        <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{trainer.full_name}</p>
        <p style={{ fontSize: 14, color: 'var(--sand-500)', marginTop: 4 }}>Personal Trainer</p>
      </div>

      {/* Step indicator */}
      <div className="animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-500)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>1</div>
          <span style={{ fontSize: 12, color: 'var(--green-600)', fontWeight: 500 }}>Plano</span>
        </div>
        <div style={{ width: 24, height: 2, background: 'var(--sand-200)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--sand-200)', color: 'var(--sand-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>2</div>
          <span style={{ fontSize: 12, color: 'var(--sand-400)' }}>Pagamento</span>
        </div>
      </div>

      <div className="animate-in delay-1">
        <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Escolha seu plano</p>
        <p style={{ fontSize: 13, color: 'var(--sand-500)', marginBottom: 14 }}>Na próxima etapa você cadastra o pagamento</p>

        {plans.map(plan => (
          <div key={plan.id} onClick={() => setSelectedPlan(plan.id)}
            style={{
              padding: '18px 20px', borderRadius: 'var(--radius-lg)', marginBottom: 10, cursor: 'pointer',
              border: selectedPlan === plan.id ? '2px solid var(--green-400)' : '1.5px solid var(--sand-200)',
              background: selectedPlan === plan.id ? 'var(--green-50)' : 'white',
              transition: 'all 0.15s',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 500 }}>{plan.name}</p>
                {plan.description && <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 4, lineHeight: 1.4 }}>{plan.description}</p>}
              </div>
              <div style={{ textAlign: 'right', marginLeft: 16 }}>
                <p style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-display)', color: selectedPlan === plan.id ? 'var(--green-600)' : 'var(--green-900)' }}>
                  {formatBRL(plan.price_cents)}
                </p>
                <p style={{ fontSize: 11, color: 'var(--sand-400)' }}>/mês</p>
              </div>
            </div>
            {selectedPlan === plan.id && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={14} color="var(--green-500)" />
                <span style={{ fontSize: 12, color: 'var(--green-600)' }}>Selecionado</span>
              </div>
            )}
          </div>
        ))}

        {plans.length === 0 && (
          <div style={{ textAlign: 'center', padding: 28, color: 'var(--sand-400)' }}>
            <p style={{ fontSize: 15 }}>Este personal ainda não configurou seus planos</p>
          </div>
        )}
      </div>

      <div className="animate-in delay-2" style={{ marginTop: 16, marginBottom: 20 }}>
        <label className="input-label"><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Onde você treina?</label>
        <input className="input-field" value={location} onChange={e => setLocation(e.target.value)}
          placeholder="Ex: Smart Fit Paulista, academia do prédio..." />
      </div>

      <button className="btn btn-primary animate-in delay-3"
        onClick={handleSelectPlan}
        disabled={!selectedPlan || subscribing}
        style={{ opacity: !selectedPlan || subscribing ? 0.6 : 1 }}>
        {subscribing
          ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} />
          : 'Continuar para pagamento →'
        }
      </button>
    </div>
  );
}