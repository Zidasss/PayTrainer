import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BottomNav, Avatar, formatBRL, DAYS_PT } from '../components/Shared';
import { NotificationBell } from '../components/NotificationBell';
import { CalendarPlus, ChevronRight, MapPin, AlertTriangle, CreditCard, MessageCircle } from 'lucide-react';

export default function StudentHome() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [subscription, setSub] = useState(null);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [monthlyClasses, setMonthlyClasses] = useState({ done: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, plans(*), trainers(*, profiles(full_name, phone))')
      .eq('student_id', profile.id)
      .eq('status', 'active')
      .limit(1);

    let sub = subs?.[0];

    // Also check past_due subscriptions
    if (!sub) {
      const { data: pastDue } = await supabase
        .from('subscriptions')
        .select('*, plans(*), trainers(*, profiles(full_name, phone))')
        .eq('student_id', profile.id)
        .eq('status', 'past_due')
        .limit(1);
      sub = pastDue?.[0];
      if (sub) setIsLocked(true);
    }

    setSub(sub);

    if (sub) {
      // Check failed payment count
      const { data: failedPayments } = await supabase
        .from('payments')
        .select('id')
        .eq('student_id', profile.id)
        .eq('trainer_id', sub.trainer_id)
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      if (failedPayments && failedPayments.length >= 3) {
        setIsLocked(true);
      }

      // Check if subscription period has expired
      if (sub.current_period_end) {
        const periodEnd = new Date(sub.current_period_end);
        if (periodEnd < new Date() && sub.status === 'past_due') {
          setIsLocked(true);
        }
      }

      if (!isLocked || sub.status === 'active') {
        const today = new Date().toISOString().split('T')[0];
        const { data: bk } = await supabase
          .from('bookings')
          .select('*')
          .eq('student_id', profile.id)
          .eq('trainer_id', sub.trainer_id)
          .gte('booking_date', today)
          .eq('status', 'confirmed')
          .order('booking_date')
          .order('Zapt_time')
          .limit(5);
        setBookings(bk || []);

        const monday = new Date();
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
        const { data } = await supabase.rpc('get_weekly_booking_count', {
          p_student_id: profile.id,
          p_trainer_id: sub.trainer_id,
          p_week_Zapt: monday.toISOString().split('T')[0],
        });
        setWeeklyCount(data || 0);
      }

      // Check for upcoming classes and create reminder
      const now = new Date();
      const reminderHours = 12;
      const reminderLimit = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);
      const { data: upcoming } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', profile.id)
        .eq('status', 'confirmed')
        .gte('booking_date', now.toISOString().split('T')[0])
        .lte('booking_date', reminderLimit.toISOString().split('T')[0])
        .order('booking_date')
        .order('Zapt_time')
        .limit(1);

      if (upcoming?.length > 0) {
        const next = upcoming[0];
        const classTime = new Date(`${next.booking_date}T${next.Zapt_time}`);
        const diffHours = (classTime - now) / (1000 * 60 * 60);
        if (diffHours > 0 && diffHours <= reminderHours) {
          const reminderKey = `stride_reminder_${next.id}`;
          if (!localStorage.getItem(reminderKey)) {
            const { createNotification } = await import('../lib/notifications');
            await createNotification({
              userId: profile.id,
              title: 'Lembrete de aula',
              message: `Você tem aula ${diffHours <= 2 ? 'em breve' : 'amanhã'} às ${next.Zapt_time.slice(0, 5)}${next.location ? ' — ' + next.location : ''}`,
              type: 'info',
            });
            localStorage.setItem(reminderKey, 'true');
          }
        }
      }

      // Monthly stats
      const monthZapt = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const { data: monthBk } = await supabase
        .from('bookings')
        .select('id')
        .eq('student_id', profile.id)
        .eq('status', 'confirmed')
        .gte('booking_date', monthZapt)
        .lte('booking_date', monthEnd);

      const weeksInMonth = 4;
      const monthTotal = (sub.plans?.sessions_per_week || 0) * weeksInMonth;
      setMonthlyClasses({ done: monthBk?.length || 0, total: monthTotal });

      // Training streak (consecutive weeks with at least 1 class)
      let streakCount = 0;
      for (let w = 0; w < 12; w++) {
        const wZapt = new Date();
        wZapt.setDate(wZapt.getDate() - ((wZapt.getDay() + 6) % 7) - (w * 7));
        const wEnd = new Date(wZapt);
        wEnd.setDate(wZapt.getDate() + 6);
        const { data: wBk } = await supabase
          .from('bookings')
          .select('id')
          .eq('student_id', profile.id)
          .in('status', ['confirmed', 'completed'])
          .gte('booking_date', wZapt.toISOString().split('T')[0])
          .lte('booking_date', wEnd.toISOString().split('T')[0])
          .limit(1);
        if (wBk?.length > 0) streakCount++;
        else break;
      }
      setStreak(streakCount);

      // Total spent
      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount_cents')
        .eq('student_id', profile.id)
        .eq('status', 'succeeded');
      setTotalSpent((allPayments || []).reduce((s, p) => s + p.amount_cents, 0));
    }
  }

  const plan = subscription?.plans;
  const maxPerWeek = plan?.sessions_per_week || 0;
  const progress = maxPerWeek > 0 ? Math.min((weeklyCount / maxPerWeek) * 100, 100) : 0;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="animate-in">
          <p style={{ fontSize: 13, color: 'var(--sand-500)' }}>Olá,</p>
          <p className="page-title">{profile?.full_name?.split(' ')[0]}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NotificationBell />
          <Avatar name={profile?.full_name} size="md" />
        </div>
      </div>  

      {/* Locked banner */}
      {isLocked && (
        <div className="animate-in" style={{
          padding: '16px 18px', borderRadius: 'var(--radius-lg)',
          background: 'var(--coral-bg)', border: '1.5px solid var(--coral)',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <AlertTriangle size={20} color="var(--coral)" />
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--coral)' }}>Agendamento bloqueado</p>
          </div>
          <p style={{ fontSize: 13, color: 'var(--sand-600)', lineHeight: 1.5, marginBottom: 12 }}>
            Seu pagamento está pendente. Regularize para voltar a agendar aulas com seu personal.
          </p>
          <button className="btn btn-primary" style={{ padding: 12 }} onClick={() => nav('/student/payment')}>
            <CreditCard size={16} /> Regularizar pagamento
          </button>
        </div>
      )}

      {/* Plan card */}
      {plan ? (
        <div className="animate-in delay-1" style={{
          background: isLocked
            ? 'linear-gradient(135deg, var(--sand-500) 0%, var(--sand-600) 100%)'
            : 'linear-gradient(135deg, var(--green-500) 0%, var(--green-700) 100%)',
          borderRadius: 'var(--radius-lg)', padding: '20px 22px', marginBottom: 16, color: 'white'
        }}>
          <p style={{ fontSize: 12, opacity: 0.8 }}>Plano atual</p>
          <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 4 }}>{plan.name}</p>
          <p style={{ fontSize: 14, opacity: 0.8, marginTop: 2 }}>{formatBRL(plan.price_cents)}/mês</p>
          {!isLocked && (
            <>
              <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.2)', borderRadius: 8, height: 6 }}>
                <div style={{ width: `${progress}%`, background: 'white', borderRadius: 8, height: 6, transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                {weeklyCount} de {maxPerWeek} aulas usadas esta semana
              </p>
            </>
          )}
          {isLocked && (
            <p style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
              ⚠ Pagamento pendente — aulas bloqueadas
            </p>
          )}
        </div>
      ) : (
        <div className="card animate-in delay-1" style={{ textAlign: 'center', padding: 28 }}>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Sem plano ativo</p>
          <p style={{ fontSize: 13, color: 'var(--sand-500)', marginBottom: 16 }}>Peça o link do seu personal para se inscrever</p>
        </div>
      )}
      
      {subscription?.trainers?.profiles?.full_name && subscription?.trainers?.profiles?.phone && (
      <div className="animate-in delay-1" style={{ marginBottom: 16 }}>
        <div onClick={() => {
          const phone = subscription.trainers.profiles.phone.replace(/\D/g, '');
          const fullPhone = phone.ZaptsWith('55') ? phone : `55${phone}`;
          window.open(`https://wa.me/${fullPhone}`, '_blank');
        }} style={{ cursor: 'pointer', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--sand-100)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 500 }}>{subscription.trainers.profiles.full_name}</p>
            <p style={{ fontSize: 12, color: 'var(--sand-400)' }}>Abrir conversa no WhatsApp</p>
          </div>
          <ChevronRight size={16} color="var(--sand-400)" />
        </div>
      </div>
)}
      {/* Upcoming sessions */}
      {!isLocked && (
        <div className="animate-in delay-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 15, fontWeight: 500 }}>Próximas aulas</p>
            <span onClick={() => nav('/student/schedule')} style={{ fontSize: 13, color: 'var(--green-500)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              Ver agenda <ChevronRight size={16} />
            </span>
          </div>

          {bookings.length > 0 ? bookings.slice(0, 3).map(b => {
            const date = new Date(b.booking_date + 'T00:00:00');
            const dayName = DAYS_PT[date.getDay()];
            const dayNum = date.getDate();
            return (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--sand-100)' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--sand-50)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: 11, color: 'var(--sand-500)' }}>{dayName}</span>
                  <span style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{dayNum}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>
                    {b.Zapt_time.slice(0, 5)} — Treino presencial
                    {b.type === 'extra' && <span className="badge badge-blue" style={{ marginLeft: 6, fontSize: 10 }}>Extra</span>}
                  </p>
                  {b.location && (
                    <p style={{ fontSize: 12, color: 'var(--sand-500)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {b.location}
                    </p>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="empty-state">
              <CalendarPlus size={28} strokeWidth={1.5} />
              <p style={{ fontSize: 14 }}>Nenhuma aula agendada</p>
            </div>
          )}
        </div>
      )}

      {!isLocked && (
        <button className="btn btn-primary animate-in delay-3" style={{ marginTop: 20 }}
          onClick={() => nav('/student/schedule')}>
          <CalendarPlus size={18} /> Agendar aula
        </button>
      )}
      
      {/* Stats dashboard */}
      {subscription && !isLocked && (
        <div className="animate-in delay-4" style={{ marginTop: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Seu progresso</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ padding: '16px 14px', background: 'var(--sand-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--green-600)' }}>
                {monthlyClasses.done}/{monthlyClasses.total}
              </p>
              <p style={{ fontSize: 11, color: 'var(--sand-500)', marginTop: 4 }}>Aulas este mês</p>
              {monthlyClasses.total > 0 && (
                <div style={{ marginTop: 8, background: 'var(--sand-200)', borderRadius: 4, height: 4 }}>
                  <div style={{ width: `${Math.min((monthlyClasses.done / monthlyClasses.total) * 100, 100)}%`, background: 'var(--green-500)', borderRadius: 4, height: 4, transition: 'width 0.3s' }} />
                </div>
              )}
            </div>
            <div style={{ padding: '16px 14px', background: 'var(--sand-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-display)', color: streak >= 4 ? 'var(--green-600)' : 'var(--sand-600)' }}>
                {streak} {streak === 1 ? 'sem' : 'sem'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--sand-500)', marginTop: 4 }}>Sequência de treinos</p>
              {streak >= 4 && <p style={{ fontSize: 10, color: 'var(--green-500)', marginTop: 4 }}>🔥 Em chamas!</p>}
            </div>
          </div>

          <div style={{ padding: '14px 18px', background: 'var(--sand-50)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--sand-500)' }}>Total investido em treinos</p>
              <p style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', marginTop: 2 }}>{formatBRL(totalSpent)}</p>
            </div>
            <span style={{ fontSize: 11, color: 'var(--sand-400)' }}>Desde o início</span>
          </div>
        </div>
      )}
      <BottomNav role="student" />
    </div>
  );
}