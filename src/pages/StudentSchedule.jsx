import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { callStripe } from '../lib/supabase';
import { BottomNav, getWeekDates, DAYS_PT, formatBRL } from '../components/Shared';
import { ChevronLeft, ChevronRight, MapPin, Check } from 'lucide-react';

export default function StudentSchedule() {
  const { profile } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState([]);
  const [subscription, setSub] = useState(null);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const weekDates = getWeekDates(weekOffset);
  const times = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  useEffect(() => { loadData(); }, [weekOffset]);

  async function loadData() {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('student_id', profile.id)
      .eq('status', 'active')
      .limit(1);

    const sub = subs?.[0];
    setSub(sub);
    if (!sub) return;

    setLocation(sub.preferred_location || '');

    const { data: avail } = await supabase
      .from('availability')
      .select('*')
      .eq('trainer_id', sub.trainer_id)
      .eq('active', true);
    setAvailability(avail || []);

    const startDate = weekDates[0].toISOString().split('T')[0];
    const endDate = weekDates[4].toISOString().split('T')[0];

    const { data: bk } = await supabase
      .from('bookings')
      .select('*')
      .eq('trainer_id', sub.trainer_id)
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .in('status', ['confirmed', 'completed']);
    setBookings(bk || []);

    const monday = weekDates[0].toISOString().split('T')[0];
    const { data: count } = await supabase.rpc('get_weekly_booking_count', {
      p_student_id: profile.id,
      p_trainer_id: sub.trainer_id,
      p_week_start: monday,
    });
    setWeeklyCount(count || 0);

    setSelected([]);
  }

  function getSlotStatus(date, time) {
    const dateStr = date.toISOString().split('T')[0];
    const dow = date.getDay();

    const isAvailable = availability.some(a => a.day_of_week === dow && a.start_time.slice(0, 5) === time);
    if (!isAvailable) return 'unavailable';

    const booking = bookings.find(b => b.booking_date === dateStr && b.start_time.slice(0, 5) === time);
    if (booking) {
      if (booking.student_id === profile.id) return 'mine';
      return 'taken';
    }

    const key = `${dateStr}_${time}`;
    if (selected.includes(key)) return 'selected';

    return 'free';
  }

  function toggleSlot(date, time) {
    const key = `${date.toISOString().split('T')[0]}_${time}`;
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  const plan = subscription?.plans;
  const maxPerWeek = plan?.sessions_per_week || 0;
  const remainingPlan = Math.max(0, maxPerWeek - weeklyCount);
  const planSlots = selected.slice(0, remainingPlan);
  const extraSlots = selected.slice(remainingPlan);

  async function confirmBookings() {
    if (!subscription || selected.length === 0) return;
    setSaving(true);

    try {
      const inserts = selected.map(key => {
        const [dateStr, time] = key.split('_');
        const isExtra = extraSlots.some(s => s === key);
        return {
          student_id: profile.id,
          trainer_id: subscription.trainer_id,
          subscription_id: subscription.id,
          booking_date: dateStr,
          start_time: time + ':00',
          end_time: (parseInt(time) + 1).toString().padStart(2, '0') + ':00:00',
          type: isExtra ? 'extra' : 'plan',
          location: location || null,
          status: isExtra ? 'pending' : 'confirmed',
        };
      });

      const { error } = await supabase.from('bookings').insert(inserts);
      if (error) throw error;

      // If there are extra classes, redirect to payment
      if (extraSlots.length > 0) {
        // For MVP: create payment for each extra class
        const data = await callStripe('pay_extra_class', {
          trainer_id: subscription.trainer_id,
        });
        if (data.url) window.location.href = data.url;
      } else {
        setToast('Aulas agendadas!');
        setTimeout(() => setToast(''), 3000);
        loadData();
      }
    } catch (err) {
      setToast('Erro ao agendar: ' + err.message);
      setTimeout(() => setToast(''), 4000);
    }
    setSaving(false);
  }

  const weekLabel = `${weekDates[0].getDate()}/${weekDates[0].getMonth() + 1} — ${weekDates[4].getDate()}/${weekDates[4].getMonth() + 1}`;

  return (
    <div className="page">
      <div className="page-header animate-in">
        <p className="page-title">Agenda</p>
        <p className="page-subtitle">Toque nos horários livres para agendar</p>
      </div>

      {/* Week navigation */}
      <div className="animate-in delay-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div onClick={() => setWeekOffset(w => w - 1)} style={{ cursor: 'pointer', padding: 8 }}>
          <ChevronLeft size={20} color="var(--sand-500)" />
        </div>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{weekLabel}</span>
        <div onClick={() => setWeekOffset(w => w + 1)} style={{ cursor: 'pointer', padding: 8 }}>
          <ChevronRight size={20} color="var(--sand-500)" />
        </div>
      </div>

      {/* Schedule grid */}
      <div className="animate-in delay-2" style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table className="schedule-grid" style={{ minWidth: 340 }}>
          <thead>
            <tr>
              <th style={{ width: 50 }}></th>
              {weekDates.map((d, i) => (
                <th key={i}>
                  <span style={{ display: 'block' }}>{DAYS_PT[d.getDay()]}</span>
                  <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--sand-400)' }}>{d.getDate()}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map(time => (
              <tr key={time}>
                <td className="time-label">{time}</td>
                {weekDates.map((date, di) => {
                  const status = getSlotStatus(date, time);
                  const slotClass = status === 'free' ? 'slot slot-free'
                    : status === 'mine' ? 'slot slot-mine'
                    : status === 'selected' ? 'slot slot-selected'
                    : status === 'taken' ? 'slot slot-taken'
                    : 'slot slot-taken';

                  return (
                    <td key={di}>
                      <div className={slotClass}
                        onClick={() => status === 'free' || status === 'selected' ? toggleSlot(date, time) : null}
                        style={status === 'unavailable' ? { opacity: 0.3, cursor: 'default' } : {}}>
                        {status === 'mine' ? <Check size={14} /> : status === 'selected' ? <Check size={14} /> : status === 'free' ? '—' : '•'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Location */}
      <div className="animate-in delay-3" style={{ marginBottom: 16 }}>
        <label className="input-label"><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Local do treino</label>
        <input className="input-field" value={location} onChange={e => setLocation(e.target.value)}
          placeholder="Ex: Smart Fit Paulista, academia do prédio..." />
      </div>

      {/* Selection summary */}
      {selected.length > 0 && (
        <div className="animate-in" style={{ marginBottom: 16 }}>
          <div style={{ padding: '12px 16px', background: 'var(--green-50)', borderRadius: 'var(--radius-md)', marginBottom: 8 }}>
            {planSlots.length > 0 && (
              <p style={{ fontSize: 13, color: 'var(--green-700)', marginBottom: extraSlots.length ? 4 : 0 }}>
                {planSlots.length} aula(s) do plano
              </p>
            )}
            {extraSlots.length > 0 && (
              <p style={{ fontSize: 13, color: 'var(--coral)' }}>
                {extraSlots.length} aula(s) extra — R$ 150,00 cada
              </p>
            )}
          </div>

          <button className="btn btn-primary" onClick={confirmBookings} disabled={saving}
            style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} />
              : `Confirmar ${selected.length} aula(s)`}
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--green-800)', color: 'white', padding: '10px 20px',
          borderRadius: 'var(--radius-full)', fontSize: 14, zIndex: 200
        }}>{toast}</div>
      )}

      <BottomNav role="student" />
    </div>
  );
}
