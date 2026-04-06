import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BottomNav, getWeekDates, DAYS_PT } from '../components/Shared';
import { ChevronLeft, ChevronRight, Plus, X, Settings } from 'lucide-react';

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

    const startDate = weekDates[0].toISOString().split('T')[0];
    const endDate = weekDates[4].toISOString().split('T')[0];
    const { data: bk } = await supabase.from('bookings')
      .select('*, profiles!bookings_student_id_fkey(full_name)')
      .eq('trainer_id', trainerId)
      .gte('booking_date', startDate).lte('booking_date', endDate)
      .in('status', ['confirmed', 'completed']);
    setBookings(bk || []);
  }

  async function toggleAvailability(dow, time) {
    const trainerId = profile.id;
    const existing = availability.find(a => a.day_of_week === dow && a.start_time.slice(0, 5) === time);

    if (existing) {
      await supabase.from('availability').delete().eq('id', existing.id);
      setAvailability(prev => prev.filter(a => a.id !== existing.id));
    } else {
      const endHour = (parseInt(time) + 1).toString().padStart(2, '0') + ':00:00';
      const { data } = await supabase.from('availability').insert({
        trainer_id: trainerId, day_of_week: dow,
        start_time: time + ':00', end_time: endHour,
      }).select().single();
      if (data) setAvailability(prev => [...prev, data]);
    }
  }

  function getSlotInfo(date, time) {
    const dateStr = date.toISOString().split('T')[0];
    const booking = bookings.find(b => b.booking_date === dateStr && b.start_time.slice(0, 5) === time);
    const isAvailable = availability.some(a => a.day_of_week === date.getDay() && a.start_time.slice(0, 5) === time);
    return { booking, isAvailable };
  }

  const weekLabel = `${weekDates[0].getDate()}/${weekDates[0].getMonth() + 1} — ${weekDates[4].getDate()}/${weekDates[4].getMonth() + 1}`;

  return (
    <div className="page">
      <div className="page-header animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="page-title">Agenda</p>
          <p className="page-subtitle">Visualize seus agendamentos</p>
        </div>
        <div onClick={() => setShowAvailSetup(!showAvailSetup)}
          style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: showAvailSetup ? 'var(--green-50)' : 'var(--sand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Settings size={18} color={showAvailSetup ? 'var(--green-500)' : 'var(--sand-500)'} />
        </div>
      </div>

      {showAvailSetup && (
        <div className="animate-in" style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--green-50)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--green-700)', marginBottom: 4 }}>Modo edição de disponibilidade</p>
          <p style={{ fontSize: 12, color: 'var(--green-600)' }}>Toque nos horários para ativar/desativar sua disponibilidade semanal</p>
        </div>
      )}

      {/* Week nav */}
      <div className="animate-in delay-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
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
                  const { booking, isAvailable } = getSlotInfo(date, time);

                  if (showAvailSetup) {
                    return (
                      <td key={di}>
                        <div className={`slot ${isAvailable ? 'slot-mine' : 'slot-free'}`}
                          onClick={() => toggleAvailability(date.getDay(), time)}
                          style={{ cursor: 'pointer' }}>
                          {isAvailable ? '✓' : <Plus size={14} />}
                        </div>
                      </td>
                    );
                  }

                  if (booking) {
                    const firstName = booking.profiles?.full_name?.split(' ')[0] || '?';
                    return (
                      <td key={di}>
                        <div className="slot slot-mine" style={{ fontSize: 10, lineHeight: 1.2 }}>
                          {firstName}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={di}>
                      <div className={`slot ${isAvailable ? 'slot-free' : 'slot-taken'}`}
                        style={!isAvailable ? { opacity: 0.3 } : {}}>
                        {isAvailable ? '—' : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BottomNav role="trainer" />
    </div>
  );
}
