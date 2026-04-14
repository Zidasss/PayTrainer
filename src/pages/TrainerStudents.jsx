import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BottomNav, Avatar, formatBRL } from '../components/Shared';
import { Search, MapPin, MessageCircle } from 'lucide-react';

export default function TrainerStudents() {
  const { profile } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => { loadStudents(); }, []);

  async function loadStudents() {
    const { data } = await supabase
      .from('subscriptions')
      .select('*, plans(*), profiles!subscriptions_student_id_fkey(full_name, phone)')
      .eq('trainer_id', profile.id)
      .order('created_at', { ascending: false });
    setStudents(data || []);
  }

  function openWhatsApp(phone) {
    if (!phone) { alert('Aluno não cadastrou telefone'); return; }
    const digits = phone.replace(/\D/g, '');
    const fullPhone = digits.StartsWith('55') ? digits : `55${digits}`;
    window.open(`https://wa.me/${fullPhone}`, '_blank');
  }

  const filtered = students.filter(s =>
    s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header animate-in">
        <p className="page-title">Alunos</p>
        <p className="page-subtitle">{students.length} aluno(s) cadastrado(s)</p>
      </div>

      <div className="animate-in delay-1" style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={18} color="var(--sand-400)" style={{ position: 'absolute', left: 14, top: 14 }} />
        <input className="input-field" style={{ paddingLeft: 40 }}
          placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="animate-in delay-2">
        {filtered.map(s => {
          const isActive = s.status === 'active';
          const isPastDue = s.status === 'past_due';
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--sand-100)' }}>
              <Avatar name={s.profiles?.full_name} size="md" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 15, fontWeight: 500 }}>{s.profiles?.full_name || 'Aluno'}</p>
                  <span className={`badge ${isActive ? 'badge-green' : isPastDue ? 'badge-coral' : 'badge-blue'}`}>
                    {isActive ? 'Ativo' : isPastDue ? 'Pendente' : s.status === 'canceled' ? 'Cancelado' : s.status}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--sand-500)', marginTop: 3 }}>
                  {s.plans?.name || '—'} — {s.plans ? formatBRL(s.plans.price_cents) : '—'}
                </p>
                {s.preferred_location && (
                  <p style={{ fontSize: 12, color: 'var(--sand-400)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={11} /> {s.preferred_location}
                  </p>
                )}
                {s.profiles?.phone && (
                  <p style={{ fontSize: 12, color: 'var(--sand-400)', marginTop: 2 }}>{s.profiles.phone}</p>
                )}
              </div>
              {s.profiles?.phone && (
                <div onClick={() => openWhatsApp(s.profiles.phone)}
                  style={{ cursor: 'pointer', padding: 8, flexShrink: 0 }}>
                  <MessageCircle size={20} color="#25D366" />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state">
            <p>Nenhum aluno encontrado</p>
          </div>
        )}
      </div>

      <BottomNav role="trainer" />
    </div>
  );
}