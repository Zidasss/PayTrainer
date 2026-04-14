import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, callStripe } from '../lib/supabase';
import { BottomNav, formatBRL, ConfirmModal } from '../components/Shared';
import { generateReceipt } from '../lib/receipt';
import { CreditCard, CheckCircle, AlertCircle, ExternalLink, Calendar, XCircle, Shield, ArrowRight } from 'lucide-react';

export default function StudentPayment() {
  const { profile, fetchProfile, session } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const isSetup = searchParams.get('setup') === 'true';
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [subscription, setSub] = useState(null);
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [changingPlan, setChangingPlan] = useState(null);
  const [activatingPayment, setActivatingPayment] = useState(false);

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
        .or(`student_id.is.null,student_id.eq.${profile.id}`)
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

  async function activatePayment() {
    if (!subscription?.plan_id) return;
    setActivatingPayment(true);
    try {
      const data = await callStripe('create_subscription', {
        plan_id: subscription.plan_id,
        trainer_id: subscription.trainer_id,
      });
      if (data.url) window.location.href = data.url;
    } catch (err) {
      alert('Pagamento não disponível no momento. O personal precisa configurar o recebimento primeiro.');
    }
    setActivatingPayment(false);
  }

  async function changePlan(planId) {
    setChangingPlan(planId);
    try {
      await supabase
        .from('subscriptions')
        .update({ plan_id: planId })
        .eq('id', subscription.id);

      try {
        const data = await callStripe('create_subscription', {
          plan_id: planId,
          trainer_id: subscription.trainer_id,
        });
        if (data.url) window.location.href = data.url;
      } catch (e) {
        loadData();
      }
    } catch (err) {
      alert('Erro: ' + err.message);
    }
    setChangingPlan(null);
  }

  async function openPortal() {
    try {
      const data = await callStripe('billing_portal');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      alert('O portal de pagamento ainda não está disponível.');
    }
  }

  async function cancelSubscription() {
    setCanceling(true);
    try {
      if (subscription?.stripe_subscription_id) {
        try {
          const data = await callStripe('billing_portal');
          if (data.url) { window.location.href = data.url; return; }
        } catch (e) {}
      }

      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('id', subscription.id);

      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('bookings')
        .update({ status: 'canceled' })
        .eq('student_id', profile.id)
        .eq('trainer_id', subscription.trainer_id)
        .gte('booking_date', today)
        .eq('status', 'confirmed');

      setShowCancelConfirm(false);
      loadData();
    } catch (err) {
      alert('Erro ao cancelar: ' + err.message);
    }
    setCanceling(false);
  }

  function getNextBillingDate() {
    const now = new Date();
    let target = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    let businessDays = 0;
    while (businessDays < 5) {
      const dow = target.getDay();
      if (dow !== 0 && dow !== 6) businessDays++;
      if (businessDays < 5) target.setDate(target.getDate() + 1);
    }
    return target;
  }

  const plan = subscription?.plans;
  const isActive = subscription?.status === 'active';
  const isCanceled = subscription?.status === 'canceled';
  const hasStripe = !!subscription?.stripe_customer_id;
  const trainerName = subscription?.trainers?.profiles?.full_name;
  const nextBilling = getNextBillingDate();

  if (loading) return <div className="page"><div className="loading-screen"><div className="spinner" /></div></div>;

  // ─── SETUP MODE: just chose a plan, needs to configure payment ───
  if (isSetup && subscription && !hasStripe) {
    return (
      <div className="page">
        <div className="page-header animate-in">
          <p className="page-title">Configurar pagamento</p>
          <p className="page-subtitle">Etapa 2 de 2</p>
        </div>

        {/* Step indicator */}
        <div className="animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-100)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>✓</div>
            <span style={{ fontSize: 12, color: 'var(--green-600)', fontWeight: 500 }}>Plano</span>
          </div>
          <div style={{ width: 24, height: 2, background: 'var(--green-400)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-500)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>2</div>
            <span style={{ fontSize: 12, color: 'var(--green-600)', fontWeight: 500 }}>Pagamento</span>
          </div>
        </div>

        {/* Plan summary */}
        <div className="card animate-in delay-1">
          <p style={{ fontSize: 12, color: 'var(--sand-500)' }}>Plano selecionado</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 500 }}>{plan?.name}</p>
              <p style={{ fontSize: 13, color: 'var(--sand-500)' }}>com {trainerName}</p>
            </div>
            <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              {plan ? formatBRL(plan.price_cents) : '—'}
            </p>
          </div>
        </div>

        {/* Payment info */}
        <div className="card animate-in delay-2" style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Shield size={18} color="var(--green-500)" />
            <p style={{ fontSize: 14, fontWeight: 500 }}>Pagamento seguro via Stripe</p>
          </div>

          <div style={{ fontSize: 13, color: 'var(--sand-600)', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
              <CheckCircle size={16} color="var(--green-500)" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>Cobrança automática mensal no cartão de crédito ou débito</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
              <CheckCircle size={16} color="var(--green-500)" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>Cobrança todo 5° dia útil do mês</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
              <CheckCircle size={16} color="var(--green-500)" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>Cancele quando quiser, sem multa</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <CheckCircle size={16} color="var(--green-500)" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>Nenhum dado de cartão armazenado no nosso servidor</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="animate-in delay-3" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => setShowPayConfirm(true)}
            disabled={activatingPayment}
            style={{ opacity: activatingPayment ? 0.6 : 1, marginBottom: 10 }}>
            {activatingPayment
              ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} />
              : <><CreditCard size={18} /> Cadastrar cartão e ativar <ArrowRight size={16} /></>
            }
          </button>

          <button className="btn btn-ghost" onClick={() => nav('/student')} style={{ marginBottom: 8 }}>
            Pular por enquanto — configurar depois
          </button>

          <p style={{ fontSize: 12, color: 'var(--sand-400)', textAlign: 'center', lineHeight: 1.5 }}>
            Você já pode agendar aulas. O pagamento pode ser configurado depois na aba Pagamento.
          </p>
        </div>

        <ConfirmModal
          show={showPayConfirm}
          title="Cadastrar pagamento"
          message="Você será redirecionado para o Stripe, nosso parceiro de pagamentos, para cadastrar seu cartão de forma segura. Nenhum dado do cartão é armazenado pelo Stride."
          confirmText="Continuar"
          cancelText="Agora não"
          onConfirm={() => { setShowPayConfirm(false); activatePayment(); }}
          onCancel={() => setShowPayConfirm(false)}
        />

        <BottomNav role="student" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header animate-in">
        <p className="page-title">Pagamento</p>
      </div>

      {/* No subscription */}
      {!subscription && (
        <div className="card animate-in delay-1" style={{ textAlign: 'center', padding: 28 }}>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Sem plano ativo</p>
          <p style={{ fontSize: 13, color: 'var(--sand-500)' }}>Peça o link de convite do seu personal para assinar um plano</p>
        </div>
      )}

      {/* Canceled */}
      {isCanceled && (
        <div className="card animate-in delay-1">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <XCircle size={20} color="var(--coral)" />
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--coral)' }}>Plano cancelado</p>
          </div>
          <p style={{ fontSize: 13, color: 'var(--sand-500)', lineHeight: 1.5 }}>
            Seu plano {plan?.name} com {trainerName} foi cancelado. Para voltar a treinar, peça um novo link de convite ao seu personal.
          </p>
        </div>
      )}

      {/* Active subscription */}
      {isActive && plan && (
        <>
          {/* Billing card */}
          <div className="card animate-in delay-1">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--sand-500)' }}>Plano atual</p>
                <p style={{ fontSize: 16, fontWeight: 500, marginTop: 2 }}>{plan.name}</p>
                <p style={{ fontSize: 12, color: 'var(--sand-500)', marginTop: 2 }}>com {trainerName}</p>
              </div>
              <p style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {formatBRL(plan.price_cents)}
              </p>
            </div>

            <div className="divider" />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Calendar size={16} color="var(--sand-500)" />
              <div>
                <p style={{ fontSize: 13, color: 'var(--sand-600)' }}>Próxima cobrança</p>
                <p style={{ fontSize: 14, fontWeight: 500 }}>
                  {subscription.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                    : nextBilling.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                  }
                </p>
              </div>
            </div>

            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: hasStripe ? 'var(--green-50)' : 'var(--coral-bg)',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              {hasStripe
                ? <><CheckCircle size={16} color="var(--green-600)" /><span style={{ fontSize: 13, color: 'var(--green-700)' }}>Cobrança automática ativa — todo 5° dia útil do mês</span></>
                : <><AlertCircle size={16} color="var(--coral)" /><span style={{ fontSize: 13, color: 'var(--coral)' }}>Cartão não cadastrado — configure abaixo</span></>
              }
            </div>
          </div>

          {/* Payment method */}
          <div className="card animate-in delay-2">
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Método de pagamento</p>

            {hasStripe ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--sand-50)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
                  <div style={{ width: 40, height: 28, borderRadius: 4, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--blue)' }}>
                    CARD
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14 }}>Cartão cadastrado via Stripe</p>
                    <p style={{ fontSize: 12, color: 'var(--sand-400)' }}>Cobrança automática mensal</p>
                  </div>
                </div>
                <button className="btn btn-outline" onClick={openPortal}>
                  <CreditCard size={18} /> Gerenciar cartão <ExternalLink size={14} />
                </button>
              </>
            ) : (
              <>
                <div style={{ padding: '14px 16px', background: 'var(--sand-50)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Shield size={16} color="var(--sand-500)" />
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--sand-600)' }}>Pagamento seguro via Stripe</p>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--sand-400)', lineHeight: 1.5 }}>
                    Cartão de crédito ou débito. Cobrança automática mensal. Cancele quando quiser.
                  </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowPayConfirm(true)}
                  disabled={activatingPayment}
                  style={{ opacity: activatingPayment ? 0.6 : 1 }}>
                  {activatingPayment
                    ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} />
                    : <><CreditCard size={18} /> Cadastrar cartão e ativar cobrança</>
                  }
                </button>
              </>
            )}
          </div>

          {/* Change plan */}
          <div className="animate-in delay-3" style={{ marginTop: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Alterar plano</p>
            {plans.map(p => {
              const isCurrent = plan?.id === p.id;
              return (
                <div key={p.id}
                  onClick={() => !isCurrent && changePlan(p.id)}
                  style={{
                    padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: 8,
                    cursor: isCurrent ? 'default' : 'pointer',
                    border: isCurrent ? '2px solid var(--green-400)' : '1.5px solid var(--sand-200)',
                    background: isCurrent ? 'var(--green-50)' : 'white',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: changingPlan === p.id ? 0.6 : 1,
                  }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 500 }}>
                      {p.name} {isCurrent && <span style={{ fontSize: 11, color: 'var(--green-600)' }}>• Atual</span>}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--sand-500)', marginTop: 2 }}>{p.sessions_per_week}x por semana</p>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', color: isCurrent ? 'var(--green-600)' : 'var(--green-900)' }}>
                    {formatBRL(p.price_cents)}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="animate-in delay-3" style={{ marginTop: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Histórico de pagamentos</p>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                  <span className={`badge ${p.status === 'succeeded' ? 'badge-green' : 'badge-coral'}`}>
                    {p.status === 'succeeded' ? 'Pago' : p.status === 'pending' ? 'Pendente' : 'Falhou'}
                  </span>
                  {p.status === 'succeeded' && (
                    <span onClick={() => generateReceipt({
                      paymentId: p.id,
                      date: p.paid_at || p.created_at,
                      amount: p.amount_cents,
                      planName: plan?.name || 'Plano',
                      trainerName: trainerName || 'Personal',
                      studentName: profile?.full_name || 'Aluno',
                      studentEmail: session?.user?.email || '',
                      description: p.description,
                    })} style={{ fontSize: 11, color: 'var(--green-500)', cursor: 'pointer', textDecoration: 'underline' }}>
                      Comprovante
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

      {/* Cancel */}
      {isActive && (
        <div className="animate-in delay-4" style={{ marginTop: 28, marginBottom: 8 }}>
          {!showCancelConfirm ? (
            <button className="btn btn-danger" onClick={() => setShowCancelConfirm(true)}>
              <XCircle size={18} /> Cancelar plano
            </button>
          ) : (
            <div style={{ padding: '18px 20px', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--coral)', background: 'var(--coral-bg)' }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--coral)', marginBottom: 6 }}>Confirmar cancelamento?</p>
              <p style={{ fontSize: 13, color: 'var(--sand-600)', lineHeight: 1.5, marginBottom: 14 }}>
                Ao cancelar, suas aulas agendadas serão canceladas e você perderá acesso à agenda do personal.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowCancelConfirm(false)}>
                  Manter plano
                </button>
                <button className="btn btn-danger" style={{ flex: 1, opacity: canceling ? 0.6 : 1 }}
                  onClick={cancelSubscription} disabled={canceling}>
                  {canceling ? 'Cancelando...' : 'Sim, cancelar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        show={showPayConfirm}
        title="Cadastrar pagamento"
        message="Você será redirecionado para o Stripe, nosso parceiro de pagamentos, para cadastrar seu cartão de forma segura. Nenhum dado do cartão é armazenado pelo Stride."
        confirmText="Continuar"
        cancelText="Agora não"
        onConfirm={() => { setShowPayConfirm(false); activatePayment(); }}
        onCancel={() => setShowPayConfirm(false)}
      />

      <BottomNav role="student" />
    </div>
  );
}