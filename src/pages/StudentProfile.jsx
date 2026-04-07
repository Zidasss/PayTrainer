import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BottomNav, Avatar, formatBRL } from '../components/Shared';
import { LogOut, MapPin, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentProfile() {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();
  const [subscription, setSub] = useState(null);
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('subscriptions')
      .select('*, plans(*), trainers(*, profiles(full_name))')
      .eq('student_id', profile.id).eq('status', 'active').limit(1)
      .then(({ data }) => {
        const sub = data?.[0];
        setSub(sub);
        setLocation(sub?.preferred_location || '');
      });
  }, []);

  async function saveLocation() {
    if (!subscription) return;
    setSaving(true);
    await supabase.from('subscriptions')
      .update({ preferred_location: location })
      .eq('id', subscription.id);
    setSaving(false);
  }

  const plan = subscription?.plans;
  const trainerName = subscription?.trainers?.profiles?.full_name;

  return (
    <div className="page">
      <div className="page-header animate-in">
        <p className="page-title">Perfil</p>
      </div>

      <div className="animate-in delay-1" style={{ textAlign: 'center', marginBottom: 24 }}>
        <Avatar name={profile?.full_name} size="lg" />
        <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 12 }}>{profile?.full_name}</p>
        {plan && <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 2 }}>{plan.name}</p>}
      </div>

      <div className="animate-in delay-2" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--sand-100)', marginBottom: 20 }}>
        {[
          ['Personal', trainerName || '—'],
          ['Plano', plan ? `${plan.name} — ${formatBRL(plan.price_cents)}` : 'Sem plano'],
          ['Telefone', profile?.phone || '—'],
          ['Email', profile?.id ? '••••@••••' : '—'],
        ].map(([label, value], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: i < 3 ? '1px solid var(--sand-100)' : 'none' }}>
            <span style={{ fontSize: 14, color: 'var(--sand-500)' }}>{label}</span>
            <span style={{ fontSize: 14 }}>{value}</span>
          </div>
        ))}
      </div>

      <div className="animate-in delay-3" style={{ marginBottom: 20 }}>
        <label className="input-label"><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Local preferido de treino</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input-field" value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Ex: Smart Fit Paulista" style={{ flex: 1 }} />
          <button className="btn btn-ghost" style={{ width: 'auto', padding: '0 16px', fontSize: 13 }}
            onClick={saveLocation} disabled={saving}>
            {saving ? '...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="animate-in delay-3" style={{ marginBottom: 12 }}
          onClick={() => nav('/feedback')}>
          <div style={{ cursor: 'pointer', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--sand-100)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <MessageSquare size={18} color="var(--sand-500)" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 500 }}>Feedback & Suporte</p>
              <p style={{ fontSize: 12, color: 'var(--sand-400)' }}>Envie sugestões ou reporte problemas</p>
            </div>
          </div>
        </div>
      
      <button className="btn btn-danger animate-in delay-4" onClick={signOut}>
        <LogOut size={18} /> Sair da conta
      </button>

      <BottomNav role="student" />
    </div>
  );
}
