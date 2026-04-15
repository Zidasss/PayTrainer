import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { callStripe } from '../lib/supabase';
import { BottomNav, getWeekDates, DAYS_PT, formatBRL } from '../components/Shared';
import { createNotification } from '../lib/notifications';
import { ChevronLeft, ChevronRight, MapPin, Check, Clock, X, AlertTriangle, Info, CalendarDays } from 'lucide-react';

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
  const [cancelingId, setCancelingId] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);
  const [extraPrice, setExtraPrice] = useState(15000);
  const [allowExtras, setAllowExtras] = useState(true);

  const weekDates = getWeekDates(weekOffset);
  const times = ['06:00','07:00','08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00','18:00','19:00'];

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

    const { data: trainerData } = await supabase
      .from('trainers')
      .select('extra_class_price, allow_extra_classes')
      .eq('id', sub.trainer_id)
      .single();
    if (trainerData?.extra_class_price) setExtraPrice(trainerData.extra_class_price);

    setAllowExtras(trainerData?.allow_extra_classes !== false);
    setLocation(sub.preferred_location || '');

    const { data: avail } = await supabase
      .from('availability')
      .select('*')
      .eq('trainer_id', sub.trainer_id)
      .eq('active', true);
    setAvailability(avail || []);

    const StartDate = weekDates[0].toISOString().split('T')[0];
    const endDate = weekDates[4].toISOString().split('T')[0];

    const { data: bk } = await supabase
      .from('bookings')
      .select('*')
      .eq('trainer_id', sub.trainer_id)
      .gte('booking_date', StartDate)
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

  // Check if a booking can be canceled (more than 2h before)
  function canCancel(booking) {
    const now = new Date();
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    const diffMs = bookingDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 10;
  }

  // Check if a date+time is in the past
  function isPast(date, time) {
    const now = new Date();
    const slotDate = new Date(`${date.toISOString().split('T')[0]}T${time}:00`);
    return slotDate < now;
  }

async function cancelBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    if (!canCancel(booking)) {
      showToast('Não é possível cancelar com menos de 10h de antecedência');
      return;
    }

    setCancelingId(bookingId);
    try {
      await supabase
        .from('bookings')
        .update({ status: 'canceled' })
        .eq('id', bookingId);

      showToast('Aula cancelada com sucesso');
      setShowCancelConfirm(null);
      loadData();
    } catch (err) {
      showToast('Erro ao cancelar: ' + err.message);
    }
    setCancelingId(null);
  }

  function getSlotStatus(date, time) {
    const dateStr = date.toISOString().split('T')[0];
    const dow = date.getDay();
    const past = isPast(date, time);

    const isAvailable = availability.some(a => a.day_of_week === dow && a.start_time.slice(0, 5) === time);
    if (!isAvailable) return { status: 'unavailable', booking: null };

    const booking = bookings.find(b => b.booking_date === dateStr && b.start_time.slice(0, 5) === time);
    if (booking) {
      if (booking.student_id === profile.id) return { status: 'mine', booking };
      return { status: 'taken', booking: null };
    }

    if (past) return { status: 'past', booking: null };

    const key = `${dateStr}_${time}`;
    if (selected.includes(key)) return { status: 'selected', booking: null };

    return { status: 'free', booking: null };
  }

  function toggleSlot(date, time) {
    if (isPast(date, time)) return;
    const key = `${date.toISOString().split('T')[0]}_${time}`;

    setSelected(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      // Check if this would be an extra class
      const newSelected = [...prev, key];
      const wouldBeExtra = newSelected.length > remainingPlan;
      if (wouldBeExtra && !allowExtras) {
        showToast('Aulas extras estão desativadas pelo seu personal');
        return prev;
      }
      return newSelected;
    });
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function addToCalendar(booking) {
    const date = booking.booking_date;
    const Start = booking.start_time.slice(0, 5);
    const endH = (parseInt(Start) + 1).toString().padStart(2, '0');
    const title = 'Treino presencial - Stride';
    const location = booking.location || '';
    const StartISO = `${date}T${Start}:00`.replace(/[-:]/g, '');
    const endISO = `${date}T${endH}:00:00`.replace(/[-:]/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${StartISO}/${endISO}&location=${encodeURIComponent(location)}`;
    window.open(url, '_blank');
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

      // Remove canceled and pending bookings for these slots first
      for (const ins of inserts) {
        await supabase.from('bookings')
          .delete()
          .eq('trainer_id', ins.trainer_id)
          .eq('booking_date', ins.booking_date)
          .eq('start_time', ins.start_time)
          .in('status', ['canceled', 'pending']);
      }

      // Also remove old bookings from THIS student for these slots
      for (const ins of inserts) {
        await supabase.from('bookings')
          .delete()
          .eq('student_id', ins.student_id)
          .eq('trainer_id', ins.trainer_id)
          .eq('booking_date', ins.booking_date)
          .eq('start_time', ins.start_time);
      }

      const { error } = await supabase.from('bookings').insert(inserts);
      if (error) throw error;

      await createNotification({
        userId: subscription.trainer_id,
        title: 'Nova aula agendada',
        message: `${profile.full_name} agendou ${selected.length} aula(s)`,
        type: 'success',
      });
      if (error) throw error;

      if (extraSlots.length > 0) {
        try {
          const data = await callStripe('pay_extra_class', {
            trainer_id: subscription.trainer_id,
          });
          if (data.url) { window.location.href = data.url; return; }
        } catch (e) {
          console.log('Stripe not available for extra class');
        }
      }

      showToast(`${selected.length} aula(s) agendada(s)!`);
      loadData();
    } catch (err) {
      showToast('Erro ao agendar: ' + err.message);
    }
    setSaving(false);
  }

  const weekLabel = `${weekDates[0].getDate()}/${weekDates[0].getMonth() + 1} — ${weekDates[4].getDate()}/${weekDates[4].getMonth() + 1}`;

  // My bookings this week for the list below
  const myBookings = bookings
    .filter(b => b.student_id === profile.id)
    .sort((a, b) => a.booking_date.localeCompare(b.booking_date) || a.start_time.localeCompare(b.start_time));

  return (
    <div className="page">
      <div className="page-header animate-in">
        <p className="page-title">Agenda</p>
        <p className="page-subtitle">Toque nos horários disponíveis para agendar</p>
      </div>

      {/* Week usage indicator */}
      {plan && (
        <div className="animate-in" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--green-50)', borderRadius: 'var(--radius-md)', marginBottom: remainingPlan === 0 && !allowExtras ? 6 : 14 }}>
          <Info size={16} color="var(--green-600)" />
          <span style={{ fontSize: 13, color: 'var(--green-700)' }}>
            {weeklyCount} de {maxPerWeek} aulas usadas esta semana
            {remainingPlan > 0 && ` · ${remainingPlan} restante(s)`}
          </span>
        </div>
      )}
      {plan && remainingPlan === 0 && !allowExtras && (
        <div className="animate-in" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--coral-bg)', borderRadius: 'var(--radius-md)', marginBottom: 14 }}>
          <AlertTriangle size={16} color="var(--coral)" />
          <span style={{ fontSize: 13, color: 'var(--coral)' }}>
            Você atingiu o limite semanal. Aulas extras não estão disponíveis no momento.
          </span>
        </div>
      )}

      {/* Week navigation */}
      <div className="animate-in delay-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
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
              {weekDates.map((d, i) => {
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <th key={i} style={{ position: 'relative' }}>
                    <span style={{ display: 'block', color: isToday ? 'var(--green-500)' : undefined }}>{DAYS_PT[d.getDay()]}</span>
                    <span style={{
                      fontSize: 11, fontWeight: isToday ? 600 : 400,
                      color: isToday ? 'white' : 'var(--sand-400)',
                      background: isToday ? 'var(--green-500)' : 'none',
                      borderRadius: '50%', width: 20, height: 20, display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>{d.getDate()}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {times.map(time => (
              <tr key={time}>
                <td className="time-label">{time}</td>
                {weekDates.map((date, di) => {
                  const { status, booking } = getSlotStatus(date, time);

                  let bg, color, content, cursor = 'pointer', border = 'none', opacity = 1;

                  switch (status) {
                    case 'mine':
                      bg = 'var(--green-500)'; color = 'white';
                      content = <Check size={13} strokeWidth={2.5} />;
                      cursor = 'pointer';
                      break;
                    case 'selected':
                      bg = 'var(--green-50)'; color = 'var(--green-600)';
                      border = '2px solid var(--green-400)';
                      content = <Check size={13} />;
                      break;
                    case 'free':
                      bg = 'var(--sand-50)'; color = 'var(--green-400)';
                      content = <Clock size={12} strokeWidth={1.5} />;
                      break;
                    case 'taken':
                      bg = 'var(--sand-100)'; color = 'var(--sand-300)';
                      content = <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sand-300)', display: 'block' }} />;
                      cursor = 'default';
                      break;
                    case 'past':
                      bg = 'var(--sand-50)'; color = 'var(--sand-300)';
                      content = null; cursor = 'default'; opacity = 0.4;
                      break;
                    default:
                      bg = 'transparent'; color = 'transparent';
                      content = null; cursor = 'default'; opacity = 0;
                      break;
                  }

                  return (
                    <td key={di}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '8px 4px', borderRadius: 'var(--radius-sm)', minHeight: 36,
                        background: bg, color, cursor, border, opacity,
                        transition: 'all 0.15s',
                      }}
                      onClick={() => {
                        if (status === 'free' || status === 'selected') toggleSlot(date, time);
                        else if (status === 'mine' && booking) setShowCancelConfirm(booking.id);
                      }}>
                        {content}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="animate-in delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, fontSize: 11, color: 'var(--sand-500)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--green-500)' }} /> Sua aula
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--sand-50)', border: '1px solid var(--sand-200)' }} />
          <Clock size={10} /> Disponível
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--sand-100)' }} /> Ocupado
        </span>
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
                ✓ {planSlots.length} aula(s) do plano
              </p>
            )}
            {extraSlots.length > 0 && (
              <p style={{ fontSize: 13, color: 'var(--coral)' }}>
                + {extraSlots.length} aula(s) extra — {formatBRL(extraPrice)} cada
              </p>
            )}
            {!allowExtras && remainingPlan === 0 && (
              <p style={{ fontSize: 12, color: 'var(--sand-400)', fontStyle: 'italic', marginBottom: 8 }}>
                Aulas extras não estão disponíveis no momento.
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

      {/* My bookings this week */}
      {myBookings.length > 0 && (
        <div className="animate-in delay-3" style={{ marginTop: 8 }}>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 10 }}>Suas aulas esta semana</p>
          {myBookings.map(b => {
            const date = new Date(b.booking_date + 'T00:00:00');
            const dayName = DAYS_PT[date.getDay()];
            const dayNum = date.getDate();
            const cancelable = canCancel(b);
            const isConfirmingCancel = showCancelConfirm === b.id;

            return (
              <div key={b.id} style={{ marginBottom: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  background: 'white', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--sand-100)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--green-50)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 10, color: 'var(--green-600)' }}>{dayName}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--green-700)' }}>{dayNum}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>
                      {b.start_time.slice(0, 5)} — Treino presencial
                    </p>
                    {b.location && (
                      <p style={{ fontSize: 12, color: 'var(--sand-500)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} /> {b.location}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div onClick={() => addToCalendar(b)} style={{ cursor: 'pointer', padding: 6, color: 'var(--green-500)' }}>
                      <CalendarDays size={16} />
                    </div>
                    {cancelable ? (
                      <div onClick={() => setShowCancelConfirm(b.id)}
                        style={{ cursor: 'pointer', padding: 6, color: 'var(--sand-400)' }}>
                        <X size={18} />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--sand-400)' }}>
                        <AlertTriangle size={12} /> Bloqueado
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancel confirmation */}
                {isConfirmingCancel && (
                  <div style={{
                    padding: '12px 14px', background: 'var(--coral-bg)', borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    marginTop: -4, borderTop: 'none',
                  }}>
                    <p style={{ fontSize: 13, color: 'var(--coral)', fontWeight: 500, marginBottom: 4 }}>Cancelar esta aula?</p>
                    <p style={{ fontSize: 12, color: 'var(--sand-600)', marginBottom: 10 }}>
                      A aula será devolvida ao seu saldo semanal.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline" style={{ flex: 1, padding: 8, fontSize: 13 }}
                        onClick={() => setShowCancelConfirm(null)}>
                        Manter
                      </button>
                      <button className="btn btn-danger" style={{ flex: 1, padding: 8, fontSize: 13 }}
                        onClick={() => cancelBooking(b.id)}
                        disabled={cancelingId === b.id}>
                        {cancelingId === b.id ? '...' : 'Sim, cancelar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Cancellation policy notice */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 0', marginTop: 4 }}>
            <AlertTriangle size={14} color="var(--sand-400)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 11, color: 'var(--sand-400)', lineHeight: 1.5 }}>
              Cancelamentos devem ser feitos com no mínimo 10 horas de antecedência. Aulas não canceladas a tempo não serão devolvidas ao saldo semanal.
            </p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--green-800)', color: 'white', padding: '10px 20px',
          borderRadius: 'var(--radius-full)', fontSize: 14, zIndex: 200,
          maxWidth: '90%', textAlign: 'center',
        }}>{toast}</div>
      )}

      <BottomNav role="student" />
    </div>
  );
}