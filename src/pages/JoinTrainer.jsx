import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, callStripe } from '../lib/supabase';
import { formatBRL } from '../components/Shared';
import { Dumbbell, Check, MapPin } from 'lucide-react';

export default function JoinTrainer() {
  const { trainerId } = useParams();
  const { profile } = useAuth();
  const nav = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => { loadTrainer(); }, []);

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

  async function subscribe() {
    if (!selectedPlan || !profile) return;
    setSubscribing(true);

    try {
      // First create the subscription record
      await supabase.from('subscriptions').upsert({
        student_id: profile.id,
        trainer_id: trainerId,
        plan_id: selectedPlan,
        preferred_location: location || null,
        status: 'trialing',
      }, { onConflict: 'student_id,trainer_id' });

      // Then redirect to Stripe checkout
      const data = await callStripe('create_subscription', {
        plan_id: selectedPlan,
        trainer_id: trainerId,
      });

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert('Erro: ' + err.message);
      setSubscribing(false);
    }
  }

  if (loading) return <div className="page"><div className="loading-screen"><div className="spinner" /></div></div>;

  if (!trainer) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Personal não encontrado</p>
        <p style={{ fontSize: 14, color: 'var(--sand-500)' }}>O link pode estar incorreto ou expirado</p>
      </div>
    </div>
  );

  if (!profile) {
    // Not logged in — redirect to auth, then back here
    nav(`/?redirect=/join/${trainerId}`);
    return null;
  }

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      {/* Trainer header */}
      <div className="animate-in" style={{ textAlign: 'center', paddingTop: 32, marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Dumbbell size={32} color="var(--green-500)" />
        </div>
        <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{trainer.full_name}</p>
        <p style={{ fontSize: 14, color: 'var(--sand-500)', marginTop: 4 }}>Personal Trainer</p>
      </div>

      {/* Plan selection */}
      <div className="animate-in delay-1">
        <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>Escolha seu plano</p>
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
      </div>

      {/* Location */}
      <div className="animate-in delay-2" style={{ marginTop: 16, marginBottom: 20 }}>
        <label className="input-label"><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Onde você treina?</label>
        <input className="input-field" value={location} onChange={e => setLocation(e.target.value)}
          placeholder="Ex: Smart Fit Paulista, academia do prédio..." />
      </div>

      {/* Subscribe button */}
      <button className="btn btn-primary animate-in delay-3"
        onClick={subscribe}
        disabled={!selectedPlan || subscribing}
        style={{ opacity: !selectedPlan || subscribing ? 0.6 : 1 }}>
        {subscribing
          ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} />
          : 'Assinar e pagar'
        }
      </button>

      <p className="animate-in delay-4" style={{ fontSize: 12, color: 'var(--sand-400)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
        Ao assinar, você autoriza a cobrança mensal recorrente no cartão cadastrado. Você pode cancelar a qualquer momento.
      </p>
    </div>
  );
}
