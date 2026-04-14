import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, callStripe } from '../lib/supabase';
import { BottomNav, Avatar, formatBRL, DAYS_PT, ConfirmModal } from '../components/Shared';
import { NotificationBell } from '../components/NotificationBell';
import { AlertCircle, ChevronRight, MapPin, Check, X, ExternalLink, Link2, ClipboardList, Star, Settings } from 'lucide-react';

export default function TrainerHome() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState({ students: 0, revenue: 0, today: 0 });
  const [todayBookings, setTodayBookings] = useState([]);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [pendingLocations, setPendingLocations] = useState([]);
  const [stripeReady, setStripeReady] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [plansCount, setPlansCount] = useState(0);
  const [showStripeConfirm, setShowStripeConfirm] = useState(false);

useEffect(() => {
    if (!profile?.id) return;
    loadData();
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true' || params.get('refresh') === 'true') {
      callStripe('check_connect_status').then(data => {
        if (data?.complete) {
          setStripeReady(true);
          window.history.replaceState({}, '', '/trainer');
        }
      }).catch(() => {});
    }
  }, [profile?.id]);

 async function loadData() {
    const trainerId = profile.id;

    // Check Stripe - auto verify if has account but not marked complete
    const { data: trainer } = await supabase
      .from('trainers')
      .select('stripe_onboarding_complete, stripe_account_id')
      .eq('id', trainerId).single();

    if (trainer?.stripe_account_id && !trainer?.stripe_onboarding_complete) {
      // Auto-check with Stripe if onboarding is complete
      try {
        const data = await callStripe('check_connect_status');
        setStripeReady(data?.complete || false);
      } catch (e) {
        setStripeReady(false);
      }
    } else {
      setStripeReady(trainer?.stripe_onboarding_complete || false);
    }

    // Plans count
    const { data: plans } = await supabase
      .from('plans')
      .select('id')
      .eq('trainer_id', trainerId)
      .eq('active', true);
    setPlansCount(plans?.length || 0);

    // Active subscriptions
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, plans(*), profiles!subscriptions_student_id_fkey(full_name)')
      .eq('trainer_id', trainerId);

    const activeSubs = (subs || []).filter(s => s.status === 'active');
    const pastDue = (subs || []).filter(s => s.status === 'past_due');
    setUnpaidCount(pastDue.length);

    const revenue = activeSubs.reduce((sum, s) => sum + (s.plans?.price_cents || 0), 0);

    // Today's bookings
    const today = new Date().toISOString().split('T')[0];
    const { data: bk } = await supabase
      .from('bookings')
      .select('*, profiles!bookings_student_id_fkey(full_name)')
      .eq('trainer_id', trainerId)
      .eq('booking_date', today)
      .eq('status', 'confirmed')
      .order('start_time');
    setTodayBookings(bk || []);

    setStats({ students: activeSubs.length, revenue, today: bk?.length || 0 });

    // Reminder for today's classes
    if (bk && bk.length > 0) {
      const reminderKey = `stride_trainer_reminder_${today}`;
      if (!localStorage.getItem(reminderKey)) {
        const { createNotification } = await import('../lib/notifications');
        await createNotification({
          userId: trainerId,
          title: 'Aulas hoje',
          message: `Você tem ${bk.length} aula(s) agendada(s) para hoje`,
          type: 'info',
        });
        localStorage.setItem(reminderKey, 'true');
      }
    }

    // Pending location requests
    const { data: pending } = await supabase
      .from('bookings')
      .select('*, profiles!bookings_student_id_fkey(full_name)')
      .eq('trainer_id', trainerId)
      .eq('location_status', 'pending')
      .not('location', 'is', null)
      .order('booking_date');
    setPendingLocations(pending || []);

    // Invite link
    setInviteLink(`${window.location.origin}/join/${trainerId}`);
  }

  async function setupStripe() {
    setShowStripeConfirm(false);
    try {
      const data = await callStripe('create_connect_account');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  }

  async function handleLocation(bookingId, status) {
    await supabase.from('bookings').update({ location_status: status }).eq('id', bookingId);
    setPendingLocations(prev => prev.filter(b => b.id !== bookingId));
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="animate-in">
          <p style={{ fontSize: 13, color: 'var(--sand-500)' }}>Olá,</p>
          <p className="page-title">{profile?.full_name?.split(' ')[0]}</p>
        </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell />
            <Avatar name={profile?.full_name} size="md" bg="var(--blue-bg)" color="var(--blue)" />
          </div>
     </div>   

      {/* Stripe setup banner */}
      {!stripeReady && (
        <div className="animate-in" onClick={() => setShowStripeConfirm(true)}
          style={{ background: 'var(--coral-bg)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={20} color="var(--coral)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--coral)' }}>Configure o recebimento</p>
            <p style={{ fontSize: 12, color: 'var(--sand-500)' }}>Toque para vincular sua conta e receber pagamentos</p>
          </div>
          <ExternalLink size={16} color="var(--coral)" />
        </div>
      )}

      {/* Plans setup - prominent card */}
      <div className="animate-in delay-1 card" onClick={() => nav('/trainer/plans')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12,
          border: plansCount === 0 ? '2px solid var(--green-400)' : undefined,
          background: plansCount === 0 ? 'var(--green-50)' : undefined }}>
        <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: plansCount === 0 ? 'var(--green-100)' : 'var(--sand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ClipboardList size={22} color={plansCount === 0 ? 'var(--green-600)' : 'var(--sand-500)'} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 500 }}>
            {plansCount === 0 ? 'Crie seus planos' : 'Meus planos'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--sand-500)' }}>
            {plansCount === 0 ? 'Configure os planos para seus alunos' : `${plansCount} plano(s) ativo(s)`}
          </p>
        </div>
        <ChevronRight size={18} color="var(--sand-400)" />
      </div>

      {/* Stats */}
      <div className="animate-in delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div className="stat-card">
          <p className="stat-label">Alunos ativos</p>
          <p className="stat-value">{stats.students}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Receita mensal</p>
          <p className="stat-value" style={{ fontSize: 20 }}>{formatBRL(stats.revenue)}</p>
        </div>
      </div>

      {/* Unpaid alert */}
      {unpaidCount > 0 && (
        <div className="animate-in delay-1" style={{ background: 'var(--coral-bg)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} color="var(--coral)" />
          <span style={{ fontSize: 13, color: 'var(--coral)' }}>{unpaidCount} aluno(s) com pagamento pendente</span>
        </div>
      )}

      {/* Invite link */}
      <div className="animate-in delay-2 card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link2 size={18} color="var(--green-500)" />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500 }}>Link de convite</p>
          <p style={{ fontSize: 11, color: 'var(--sand-400)', wordBreak: 'break-all' }}>{inviteLink}</p>
        </div>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }}
          onClick={copyLink}>
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      {/* Public profile link */}
        <div className="animate-in delay-2 card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <Star size={18} color="var(--green-500)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500 }}>Agenda pública</p>
            <p style={{ fontSize: 11, color: 'var(--sand-400)', wordBreak: 'break-all' }}>
              {window.location.origin}/t/{profile?.slug || profile?.full_name?.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '')}
            </p>
          </div>
          <button className="btn btn-ghost" style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }}
            onClick={() => {
              const s = profile?.slug || profile?.full_name?.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
              navigator.clipboard.writeText(`${window.location.origin}/t/${s}`);
            }}>
            Copiar
          </button>
        </div>

      {/* Today's sessions */}
      <div className="animate-in delay-2" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Hoje — {DAYS_PT[new Date().getDay()]}</p>
          <span onClick={() => nav('/trainer/schedule')} style={{ fontSize: 13, color: 'var(--green-500)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
            Agenda <ChevronRight size={16} />
          </span>
        </div>

        {todayBookings.length > 0 ? todayBookings.map(b => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--sand-100)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--sand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: 15 }}>
              {b.start_time.slice(0, 5)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{b.profiles?.full_name || 'Aluno'}</p>
              {b.location && <p style={{ fontSize: 12, color: 'var(--sand-500)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{b.location}</p>}
            </div>
            {b.type === 'extra' && <span className="badge badge-blue">Extra</span>}
          </div>
        )) : (
          <div className="empty-state" style={{ padding: 24 }}>
            <p style={{ fontSize: 14 }}>Nenhuma aula hoje</p>
          </div>
        )}
      </div>

      {/* Pending location requests */}
      {pendingLocations.length > 0 && (
        <div className="animate-in delay-3" style={{ marginTop: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 10 }}>Solicitações de local</p>
          {pendingLocations.map(b => (
            <div key={b.id} className="card">
              <p style={{ fontSize: 14, fontWeight: 500 }}>{b.profiles?.full_name} sugere:</p>
              <p style={{ fontSize: 13, color: 'var(--sand-500)', margin: '4px 0 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} /> {b.location} — {new Date(b.booking_date + 'T00:00:00').toLocaleDateString('pt-BR')} {b.start_time.slice(0, 5)}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1, padding: 10 }} onClick={() => handleLocation(b.id, 'approved')}>
                  <Check size={16} /> Aceitar
                </button>
                <button className="btn btn-outline" style={{ flex: 1, padding: 10 }} onClick={() => handleLocation(b.id, 'rejected')}>
                  <X size={16} /> Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        show={showStripeConfirm}
        title="Configurar recebimento"
        message="Você será redirecionado para o Stripe, nosso parceiro de pagamentos, para configurar sua conta bancária e começar a receber."
        confirmText="Ir para o Stripe"
        cancelText="Agora não"
        onConfirm={setupStripe}
        onCancel={() => setShowStripeConfirm(false)}
      />
      <BottomNav role="trainer" />
    </div>
  );
}