import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, callStripe } from '../lib/supabase';
import { BottomNav, formatBRL } from '../components/Shared';
import { CreditCard, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export default function StudentPayment() {
  const { profile } = useAuth();
  const [subscription, setSub] = useState(null);
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, plans(*), trainers(*, profiles(full_name))')
      .eq('student_id', profile.id)
      .limit(1);

    const sub = subs?.[0];
    setSub(sub);

    if (sub) {
      const { data: trainerPlans } = await supabase
        .from('plans')
        .select('*')
        .eq('trainer_id', sub.trainer_id)
        .eq('active', true)
        .order('sessions_per_week');
      setPlans(trainerPlans || []);

      const { data: pmts } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setPayments(pmts || []);
    }

    setLoading(false);
  }

  async function subscribe(planId) {
    try {
      const data = await callStripe('create_subscription', {
        plan_id: planId,
        trainer_id: subscription?.trainer_id,
      });
      if (data.url) window.location.href = data.url;
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  }

  async function openPortal() {
    try {
      const data = await callStripe('billing_portal');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  }

  const plan = subscription?.plans;
  const isActive = subscription?.status === 'active';
  const isPastDue = subscription?.status === 'past_due';

  if (loading) return <div className="page"><div className="loading-screen"><div className="spinner" /></div></div>;

  return (
    <div className="page">
      <div className="page-header animate-in">
        <p className="page-title">Pagamento</p>
      </div>

      {/* Status card */}
      {subscription && (
        <div className="card animate-in delay-1">
          <p style={{ fontSize: 12, color: 'var(--sand-500)' }}>
            {isActive ? 'Próxima cobrança' : 'Pagamento pendente'}
          </p>
          <p style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 6 }}>
            {plan ? formatBRL(plan.price_cents) : '—'}
          </p>
          {subscription.current_period_end && (
            <p style={{ fontSize: 12, color: 'var(--sand-500)', marginTop: 2 }}>
              Vencimento: {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
            </p>
          )}

          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: isActive ? 'var(--green-50)' : 'var(--coral-bg)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            {isActive ? <CheckCircle size={16} color="var(--green-600)" /> : <AlertCircle size={16} color="var(--coral)" />}
            <span style={{ fontSize: 13, color: isActive ? 'var(--green-700)' : 'var(--coral)' }}>
              {isActive ? 'Pagamento automático ativo' : 'Pagamento pendente — atualize seu cartão'}
            </span>
          </div>
        </div>
      )}

      {/* Manage billing */}
      {subscription?.stripe_customer_id && (
        <button className="btn btn-outline animate-in delay-2" onClick={openPortal} style={{ marginBottom: 16 }}>
          <CreditCard size={18} /> Gerenciar cartão <ExternalLink size={14} />
        </button>
      )}

      {/* Plans */}
      <div className="animate-in delay-2">
        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>
          {plan ? 'Alterar plano' : 'Escolha seu plano'}
        </p>
        {plans.map(p => {
          const isCurrent = plan?.id === p.id;
          return (
            <div key={p.id} onClick={() => !isCurrent && subscribe(p.id)}
              style={{
                padding: '16px 18px', borderRadius: 'var(--radius-md)', marginBottom: 10, cursor: isCurrent ? 'default' : 'pointer',
                border: isCurrent ? '2px solid var(--green-400)' : '1.5px solid var(--sand-200)',
                background: isCurrent ? 'var(--green-50)' : 'white',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</p>
                <p style={{ fontSize: 12, color: 'var(--sand-500)', marginTop: 2 }}>{p.description}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', color: isCurrent ? 'var(--green-600)' : 'var(--green-900)' }}>
                  {formatBRL(p.price_cents)}
                </p>
                <p style={{ fontSize: 11, color: 'var(--sand-400)' }}>/mês</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="animate-in delay-3" style={{ marginTop: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Histórico</p>
          {payments.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--sand-100)' }}>
              <div>
                <p style={{ fontSize: 14 }}>{p.description || 'Pagamento'}</p>
                <p style={{ fontSize: 12, color: 'var(--sand-400)', marginTop: 2 }}>
                  {p.paid_at ? new Date(p.paid_at).toLocaleDateString('pt-BR') : '—'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{formatBRL(p.amount_cents)}</p>
                <span className={`badge ${p.status === 'succeeded' ? 'badge-green' : 'badge-coral'}`}>
                  {p.status === 'succeeded' ? 'Pago' : p.status === 'pending' ? 'Pendente' : 'Falhou'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav role="student" />
    </div>
  );
}
