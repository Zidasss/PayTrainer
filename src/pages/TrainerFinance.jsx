import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, callStripe } from '../lib/supabase';
import { BottomNav, Avatar, formatBRL, ConfirmModal } from '../components/Shared';
import { TrendingUp, ArrowDownRight, ExternalLink, AlertCircle, Users, Calendar, Percent, Clock } from 'lucide-react';

export default function TrainerFinance() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [allSubs, setAllSubs] = useState([]);
  const [stripeReady, setStripeReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showStripeConfirm, setShowStripeConfirm] = useState(false);
  const [occupancy, setOccupancy] = useState({ filled: 0, total: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => { loadData(); }, [month]);

  async function loadData() {
    setLoading(true);
    const trainerId = profile.id;

    const { data: trainer } = await supabase
      .from('trainers')
      .select('stripe_onboarding_complete')
      .eq('id', trainerId).single();
    setStripeReady(trainer?.stripe_onboarding_complete || false);

    // All subscriptions (for inadimplents)
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, plans(*), profiles!subscriptions_student_id_fkey(full_name, phone)')
      .eq('trainer_id', trainerId);
    setAllSubs(subs || []);

    const activeSubs = (subs || []).filter(s => s.status === 'active');
    setStudents(activeSubs);

    // Payments for selected month
    const startDate = `${month}-01T00:00:00`;
    const [y, m] = month.split('-').map(Number);
    const endDate = new Date(y, m, 1).toISOString();

    const { data: pmts } = await supabase
      .from('payments')
      .select('*, profiles!payments_student_id_fkey(full_name)')
      .eq('trainer_id', trainerId)
      .gte('created_at', startDate)
      .lt('created_at', endDate)
      .order('created_at', { ascending: false });
    setPayments(pmts || []);

    // Occupancy: count bookings this week vs available slots
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const { data: avail } = await supabase
      .from('availability')
      .select('id')
      .eq('trainer_id', trainerId)
      .eq('active', true);
    const totalSlots = (avail?.length || 0);

    const { data: weekBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('trainer_id', trainerId)
      .gte('booking_date', monday.toISOString().split('T')[0])
      .lte('booking_date', friday.toISOString().split('T')[0])
      .eq('status', 'confirmed');
    setOccupancy({ filled: weekBookings?.length || 0, total: totalSlots });

    // Monthly revenue last 6 months
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01T00:00:00`;
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();

      const { data: mPmts } = await supabase
        .from('payments')
        .select('trainer_amount_cents')
        .eq('trainer_id', trainerId)
        .eq('status', 'succeeded')
        .gte('created_at', mStart)
        .lt('created_at', mEnd);

      const total = (mPmts || []).reduce((s, p) => s + (p.trainer_amount_cents || 0), 0);
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      revenueData.push({ label, total });
    }
    setMonthlyRevenue(revenueData);

    setLoading(false);
  }

  async function openStripeDashboard() {
    setShowStripeConfirm(false);
    try {
      const loginData = await callStripe('create_login_link');
      if (loginData?.url) { window.open(loginData.url, '_blank'); return; }
    } catch (err) {
      window.open('https://dashboard.stripe.com/', '_blank');
    }
  }

  const totalRevenue = students.reduce((sum, s) => sum + (s.plans?.price_cents || 0), 0);
  const platformFee = Math.round(totalRevenue * 0.08);
  const netRevenue = totalRevenue - platformFee;

  const monthPayments = payments.filter(p => p.status === 'succeeded');
  const totalPaid = monthPayments.reduce((sum, p) => sum + p.trainer_amount_cents, 0);

  const inadimplents = allSubs.filter(s => s.status === 'past_due');
  const occupancyRate = occupancy.total > 0 ? Math.round((occupancy.filled / occupancy.total) * 100) : 0;
  const maxRevenue = Math.max(...monthlyRevenue.map(r => r.total), 1);

  const monthOptions = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    monthOptions.push({ val, label });
  }

  return (
    <div className="page">
      <div className="page-header animate-in">
        <p className="page-title">Finanças</p>
      </div>

      {/* Revenue card */}
      <div className="animate-in delay-1" style={{
        background: 'linear-gradient(135deg, var(--green-700) 0%, var(--green-900) 100%)',
        borderRadius: 'var(--radius-lg)', padding: '22px 24px', marginBottom: 16, color: 'white'
      }}>
        <p style={{ fontSize: 12, opacity: 0.7 }}>Receita líquida estimada</p>
        <p style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 700, marginTop: 4 }}>
          {formatBRL(netRevenue)}
        </p>
        <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>/mês • {students.length} aluno(s) ativo(s)</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 13, opacity: 0.8 }}>
          <span>Bruto: {formatBRL(totalRevenue)}</span>
          <span>Taxa (8%): {formatBRL(platformFee)}</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="animate-in delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ padding: '14px 12px', background: 'var(--sand-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <Users size={18} color="var(--green-500)" style={{ margin: '0 auto 6px' }} />
          <p style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{students.length}</p>
          <p style={{ fontSize: 11, color: 'var(--sand-500)' }}>Ativos</p>
        </div>
        <div style={{ padding: '14px 12px', background: inadimplents.length > 0 ? 'var(--coral-bg)' : 'var(--sand-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <AlertCircle size={18} color={inadimplents.length > 0 ? 'var(--coral)' : 'var(--sand-400)'} style={{ margin: '0 auto 6px' }} />
          <p style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-display)', color: inadimplents.length > 0 ? 'var(--coral)' : undefined }}>{inadimplents.length}</p>
          <p style={{ fontSize: 11, color: inadimplents.length > 0 ? 'var(--coral)' : 'var(--sand-500)' }}>Inadimplentes</p>
        </div>
        <div style={{ padding: '14px 12px', background: 'var(--sand-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <Percent size={18} color="var(--blue)" style={{ margin: '0 auto 6px' }} />
          <p style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{occupancyRate}%</p>
          <p style={{ fontSize: 11, color: 'var(--sand-500)' }}>Ocupação</p>
        </div>
      </div>

      {/* Revenue chart */}
      {monthlyRevenue.length > 0 && (
        <div className="animate-in delay-2" style={{ padding: '18px 20px', background: 'var(--sand-50)', borderRadius: 'var(--radius-lg)', marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Receita últimos 6 meses</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
            {monthlyRevenue.map((m, i) => {
              const height = maxRevenue > 0 ? Math.max((m.total / maxRevenue) * 100, 4) : 4;
              const isLast = i === monthlyRevenue.length - 1;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, color: 'var(--sand-500)' }}>
                    {m.total > 0 ? formatBRL(m.total) : '—'}
                  </span>
                  <div style={{
                    width: '100%', height: `${height}%`, minHeight: 4,
                    background: isLast ? 'var(--green-500)' : 'var(--green-200)',
                    borderRadius: '4px 4px 0 0', transition: 'height 0.3s',
                  }} />
                  <span style={{ fontSize: 10, color: isLast ? 'var(--green-600)' : 'var(--sand-400)', fontWeight: isLast ? 600 : 400 }}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inadimplent students */}
      {inadimplents.length > 0 && (
        <div className="animate-in delay-2" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 10, color: 'var(--coral)' }}>Alunos inadimplentes</p>
          {inadimplents.map(s => {
            const daysSince = s.current_period_end
              ? Math.floor((new Date() - new Date(s.current_period_end)) / (1000 * 60 * 60 * 24))
              : 0;
            return (
              <div key={s.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--coral-bg)',
                marginBottom: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={s.profiles?.full_name} size="sm" bg="var(--coral-bg)" color="var(--coral)" />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>{s.profiles?.full_name || 'Aluno'}</p>
                    <p style={{ fontSize: 12, color: 'var(--coral)' }}>{s.plans?.name || '—'} — {s.plans ? formatBRL(s.plans.price_cents) : '—'}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--coral)' }}>
                    {daysSince > 0 ? `${daysSince}d atraso` : 'Pendente'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stripe dashboard button */}
      {stripeReady && (
        <button className="btn btn-outline animate-in delay-2" onClick={() => setShowStripeConfirm(true)} style={{ marginBottom: 16 }}>
          <TrendingUp size={18} /> Painel Stripe <ExternalLink size={14} />
        </button>
      )}

      {/* Month filter */}
      <div className="animate-in delay-2" style={{ marginBottom: 16 }}>
        <select className="input-field" value={month} onChange={e => setMonth(e.target.value)}
          style={{ cursor: 'pointer', textTransform: 'capitalize' }}>
          {monthOptions.map(o => (
            <option key={o.val} value={o.val} style={{ textTransform: 'capitalize' }}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Per-student breakdown */}
      <div className="animate-in delay-3">
        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Detalhamento por aluno</p>

        {students.map(s => {
          const price = s.plans?.price_cents || 0;
          const fee = Math.round(price * 0.08);
          const net = price - fee;
          return (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--sand-100)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={s.profiles?.full_name} size="sm" />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{s.profiles?.full_name || 'Aluno'}</p>
                  <p style={{ fontSize: 12, color: 'var(--sand-500)' }}>{s.plans?.name || '—'}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{formatBRL(net)}</p>
                <p style={{ fontSize: 11, color: 'var(--sand-400)', display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                  <ArrowDownRight size={10} /> {formatBRL(fee)} taxa
                </p>
              </div>
            </div>
          );
        })}

        {students.length === 0 && (
          <div className="empty-state"><p>Nenhum aluno ativo</p></div>
        )}
      </div>

      {/* Payment history */}
      {monthPayments.length > 0 && (
        <div className="animate-in delay-4" style={{ marginTop: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Pagamentos recebidos</p>
          {monthPayments.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--sand-100)' }}>
              <div>
                <p style={{ fontSize: 14 }}>{p.profiles?.full_name || 'Aluno'}</p>
                <p style={{ fontSize: 12, color: 'var(--sand-400)', marginTop: 2 }}>
                  {p.description} • {p.paid_at ? new Date(p.paid_at).toLocaleDateString('pt-BR') : '—'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--green-500)', marginTop: 2 }}>
                  Previsto na conta em {p.paid_at ? new Date(new Date(p.paid_at).getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR') : '—'}
                </p>
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--green-600)' }}>
                {formatBRL(p.trainer_amount_cents)}
              </p>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', fontWeight: 500, fontSize: 15 }}>
            <span>Total recebido</span>
            <span style={{ color: 'var(--green-600)' }}>{formatBRL(totalPaid)}</span>
          </div>
        </div>
      )}

      {/* Forecast */}
      <div className="animate-in delay-4" style={{ marginTop: 16, padding: '16px 20px', background: 'var(--green-50)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--green-700)', marginBottom: 4 }}>Previsão próximo mês</p>
        <p style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--green-700)' }}>
          {formatBRL(netRevenue)}
        </p>
        <p style={{ fontSize: 12, color: 'var(--green-600)', marginTop: 2 }}>
          Baseado nos {students.length} aluno(s) ativo(s) atual
        </p>
      </div>

      <ConfirmModal
        show={showStripeConfirm}
        title="Abrir painel Stripe"
        message="Você será redirecionado para o painel do Stripe, onde pode consultar saldos, transferências e dados bancários."
        confirmText="Abrir Stripe"
        cancelText="Cancelar"
        onConfirm={openStripeDashboard}
        onCancel={() => setShowStripeConfirm(false)}
      />

      <BottomNav role="trainer" />
    </div>
  );
}