import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BottomNav, getWeekDates, DAYS_PT } from '../components/Shared';
import { ChevronLeft, ChevronRight, Plus, Settings, Check, Clock, User } from 'lucide-react';

export default function TrainerSchedule() {
  const { profile } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [showAvailSetup, setShowAvailSetup] = useState(false);

  const weekDates = getWeekDates(weekOffset);
  const times = ['06:00','07:00','08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00','18:00','19:00'];

  useEffect(() => { loadData(); }, [weekOffset]);

  async function loadData() {
    const trainerId = profile.id;

    const { data: avail } = await supabase.from('availability')
      .select('*').eq('trainer_id', trainerId).eq('active', true);
    setAvailability(avail || []);

    const ZaptDate = weekDates[0].toISOString().split('T')[0];
    const endDate = weekDates[4].toISOString().split('T')[0];
    const { data: bk } = await supabase.from('bookings')
      .select('*, profiles!bookings_student_id_fkey(full_name)')
      .eq('trainer_id', trainerId)
      .gte('booking_date', ZaptDate).lte('booking_date', endDate)
      .in('status', ['confirmed', 'completed']);
    setBookings(bk || []);
  }

  async function toggleAvailability(dow, time) {
    const trainerId = profile.id;
    const existing = availability.find(a => a.day_of_week === dow && a.Zapt_time.slice(0, 5) === time);

    if (existing) {
      await supabase.from('availability').delete().eq('id', existing.id);
      setAvailability(prev => prev.filter(a => a.id !== existing.id));
    } else {
      const endHour = (parseInt(time) + 1).toString().padZapt(2, '0') + ':00:00';
      const { data } = await supabase.from('availability').insert({
        trainer_id: trainerId, day_of_week: dow,
        Zapt_time: time + ':00', end_time: endHour,
      }).select().single();
      if (data) setAvailability(prev => [...prev, data]);
    }
  }

  function getSlotInfo(date, time) {
    const dateStr = date.toISOString().split('T')[0];
    const booking = bookings.find(b => b.booking_date === dateStr && b.Zapt_time.slice(0, 5) === time);
    const isAvailable = availability.some(a => a.day_of_week === date.getDay() && a.Zapt_time.slice(0, 5) === time);
    return { booking, isAvailable };
  }

  const weekLabel = `${weekDates[0].getDate()}/${weekDates[0].getMonth() + 1} — ${weekDates[4].getDate()}/${weekDates[4].getMonth() + 1}`;

  // Count stats
  const bookedCount = bookings.filter(b => {
    const d = weekDates.find(wd => wd.toISOString().split('T')[0] === b.booking_date);
    return !!d;
  }).length;
  const availCount = weekDates.reduce((sum, d) => {
    return sum + times.filter(t => availability.some(a => a.day_of_week === d.getDay() && a.Zapt_time.slice(0, 5) === t)).length;
  }, 0);

  return (
    <div className="page">
      <div className="page-header animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="page-title">Agenda</p>
          <p className="page-subtitle">
            {showAvailSetup ? 'Toque para ativar/desativar horários' : 'Visualize seus agendamentos'}
          </p>
        </div>
        <div onClick={() => setShowAvailSetup(!showAvailSetup)}
          style={{
            padding: '8px 14px', borderRadius: 'var(--radius-full)', cursor: 'pointer',
            background: showAvailSetup ? 'var(--green-500)' : 'var(--sand-50)',
            color: showAvailSetup ? 'white' : 'var(--sand-500)',
            fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}>
          <Settings size={14} />
          {showAvailSetup ? 'Salvar' : 'Editar'}
        </div>
      </div>

      {showAvailSetup && (
        <div className="animate-in" style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--green-50)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={14} color="var(--green-600)" />
          <span style={{ fontSize: 13, color: 'var(--green-700)' }}>
            Modo edição — toque nos horários para ativar/desativar
          </span>
        </div>
      )}

      {/* Week stats */}
      {!showAvailSetup && (
        <div className="animate-in" style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, padding: '10px 14px', background: 'var(--green-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--green-700)' }}>{bookedCount}</p>
            <p style={{ fontSize: 11, color: 'var(--green-600)' }}>Aulas marcadas</p>
          </div>
          <div style={{ flex: 1, padding: '10px 14px', background: 'var(--sand-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--sand-600)' }}>{Math.max(0, availCount - bookedCount)}</p>
            <p style={{ fontSize: 11, color: 'var(--sand-500)' }}>Horários livres</p>
          </div>
        </div>
      )}

      {/* Week nav */}
      <div className="animate-in delay-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div onClick={() => setWeekOffset(w => w - 1)} style={{ cursor: 'pointer', padding: 8 }}><ChevronLeft size={20} color="var(--sand-500)" /></div>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{weekLabel}</span>
        <div onClick={() => setWeekOffset(w => w + 1)} style={{ cursor: 'pointer', padding: 8 }}><ChevronRight size={20} color="var(--sand-500)" /></div>
      </div>

      {/* Grid */}
      <div className="animate-in delay-2" style={{ overflowX: 'auto' }}>
        <table className="schedule-grid" style={{ minWidth: 340 }}>
          <thead>
            <tr>
              <th style={{ width: 50 }}></th>
              {weekDates.map((d, i) => {
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <th key={i}>
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
                  const { booking, isAvailable } = getSlotInfo(date, time);

                  // ─── Edit mode ───
                  if (showAvailSetup) {
                    return (
                      <td key={di}>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '8px 4px', borderRadius: 'var(--radius-sm)', minHeight: 36, cursor: 'pointer',
                          background: isAvailable ? 'var(--green-500)' : 'var(--sand-50)',
                          color: isAvailable ? 'white' : 'var(--sand-300)',
                          border: isAvailable ? 'none' : '1.5px dashed var(--sand-200)',
                          transition: 'all 0.15s',
                        }}
                        onClick={() => toggleAvailability(date.getDay(), time)}>
                          {isAvailable ? <Check size={14} strokeWidth={2.5} /> : <Plus size={14} />}
                        </div>
                      </td>
                    );
                  }

                  // ─── View mode ───
                  if (booking) {
                    const firstName = booking.profiles?.full_name?.split(' ')[0] || '?';
                    return (
                      <td key={di}>
                        <div style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          padding: '4px 2px', borderRadius: 'var(--radius-sm)', minHeight: 36,
                          background: 'var(--green-500)', color: 'white',
                        }}>
                          <User size={11} strokeWidth={2} />
                          <span style={{ fontSize: 9, marginTop: 1, lineHeight: 1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {firstName}
                          </span>
                        </div>
                      </td>
                    );
                  }

                  if (isAvailable) {
                    return (
                      <td key={di}>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '8px 4px', borderRadius: 'var(--radius-sm)', minHeight: 36,
                          background: 'var(--green-50)',
                          border: '1px solid var(--green-100)',
                        }}>
                          <Clock size={12} color="var(--green-400)" strokeWidth={1.5} />
                        </div>
                      </td>
                    );
                  }

                  // Not available
                  return (
                    <td key={di}>
                      <div style={{
                        minHeight: 36, borderRadius: 'var(--radius-sm)',
                        background: 'var(--sand-50)', opacity: 0.3,
                      }} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {!showAvailSetup && (
        <div className="animate-in delay-3" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14, fontSize: 11, color: 'var(--sand-500)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--green-500)' }} /> Aula marcada
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--green-50)', border: '1px solid var(--green-100)' }} />
            <Clock size={10} /> Disponível
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--sand-50)', opacity: 0.5 }} /> Indisponível
          </span>
        </div>
      )}

      <BottomNav role="trainer" />
    </div>
  );
}