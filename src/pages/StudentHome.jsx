import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BottomNav, Avatar, formatBRL, DAYS_PT } from '../components/Shared';
import { CalendarPlus, ChevronRight, MapPin } from 'lucide-react';

export default function StudentHome() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [subscription, setSub] = useState(null);
  const [weeklyCount, setWeeklyCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Get active subscription
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, plans(*), trainers(*, profiles(full_name))')
      .eq('student_id', profile.id)
      .eq('status', 'active')
      .limit(1);

    const sub = subs?.[0];
    setSub(sub);

    if (sub) {
      // Get upcoming bookings
      const today = new Date().toISOString().split('T')[0];
      const { data: bk } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', profile.id)
        .eq('trainer_id', sub.trainer_id)
        .gte('booking_date', today)
        .eq('status', 'confirmed')
        .order('booking_date')
        .order('start_time')
        .limit(5);

      setBookings(bk || []);

      // Count this week's bookings
      const monday = new Date();
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      const { data } = await supabase.rpc('get_weekly_booking_count', {
        p_student_id: profile.id,
        p_trainer_id: sub.trainer_id,
        p_week_start: monday.toISOString().split('T')[0],
      });
      setWeeklyCount(data || 0);
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
        <Avatar name={profile?.full_name} size="md" />
      </div>

      {/* Plan card */}
      {plan ? (
        <div className="animate-in delay-1" style={{
          background: 'linear-gradient(135deg, var(--green-500) 0%, var(--green-700) 100%)',
          borderRadius: 'var(--radius-lg)', padding: '20px 22px', marginBottom: 16, color: 'white'
        }}>
          <p style={{ fontSize: 12, opacity: 0.8 }}>Plano atual</p>
          <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 4 }}>{plan.name}</p>
          <p style={{ fontSize: 14, opacity: 0.8, marginTop: 2 }}>{formatBRL(plan.price_cents)}/mês</p>
          <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.2)', borderRadius: 8, height: 6 }}>
            <div style={{ width: `${progress}%`, background: 'white', borderRadius: 8, height: 6, transition: 'width 0.3s' }} />
          </div>
          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
            {weeklyCount} de {maxPerWeek} aulas usadas esta semana
          </p>
        </div>
      ) : (
        <div className="card animate-in delay-1" style={{ textAlign: 'center', padding: 28 }}>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Sem plano ativo</p>
          <p style={{ fontSize: 13, color: 'var(--sand-500)', marginBottom: 16 }}>Peça o link do seu personal para se inscrever</p>
        </div>
      )}

      {/* Upcoming sessions */}
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
                  {b.start_time.slice(0, 5)} — Treino presencial
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

      <button className="btn btn-primary animate-in delay-3" style={{ marginTop: 20 }}
        onClick={() => nav('/student/schedule')}>
        <CalendarPlus size={18} /> Agendar aula
      </button>

      <BottomNav role="student" />
    </div>
  );
}
