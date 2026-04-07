import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, callStripe } from '../lib/supabase';
import { BottomNav, Avatar, formatBRL } from '../components/Shared';
import { TrendingUp, ArrowDownRight, ExternalLink, RefreshCw } from 'lucide-react';

export default function TrainerFinance() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [stripeReady, setStripeReady] = useState(false);
  const [loading, setLoading] = useState(true);
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

    // Active subscriptions with plan info
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, plans(*), profiles!subscriptions_student_id_fkey(full_name)')
      .eq('trainer_id', trainerId)
      .eq('status', 'active');
    setStudents(subs || []);

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

    setLoading(false);
  }

  async function openStripeDashboard() {
    try {
      const data = await callStripe('check_connect_status');
      if (data.account_id) {
        // Create a login link via edge function
        const loginData = await callStripe('create_login_link');
        if (loginData?.url) {
          window.open(loginData.url, '_blank');
          return;
        }
      }
    } catch (err) {
      // Fallback: open Stripe dashboard
      window.open('https://dashboard.stripe.com/', '_blank');
    }
  }

  const totalRevenue = students.reduce((sum, s) => sum + (s.plans?.price_cents || 0), 0);
  const platformFee = Math.round(totalRevenue * 0.08);
  const netRevenue = totalRevenue - platformFee;

  const monthPayments = payments.filter(p => p.status === 'succeeded');
  const totalPaid = monthPayments.reduce((sum, p) => sum + p.trainer_amount_cents, 0);
  const totalFees = monthPayments.reduce((sum, p) => sum + p.platform_fee_cents, 0);

  // Generate month options
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

      {/* Stripe dashboard button */}
      {stripeReady && (
        <button className="btn btn-outline animate-in delay-2" onClick={openStripeDashboard} style={{ marginBottom: 16 }}>
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

      <BottomNav role="trainer" />
    </div>
  );
}
