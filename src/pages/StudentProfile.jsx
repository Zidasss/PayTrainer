import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BottomNav, Avatar, formatBRL } from '../components/Shared';
import { formatPhone, isValidPhone } from '../lib/validation';
import { LogOut, Save, Phone, MessageSquare, Shield, Mail, User, Pencil, MapPin } from 'lucide-react';

export default function StudentProfile() {
  const { profile, signOut, fetchProfile, session } = useAuth();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subscription, setSub] = useState(null);
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setEmail(session?.user?.email || '');
      loadSubscription();
    }
  }, [profile]);

  async function loadSubscription() {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, plans(*), trainers(*, profiles(full_name))')
      .eq('student_id', profile.id)
      .eq('status', 'active')
      .limit(1);
    const sub = subs?.[0];
    setSub(sub);
    setLocation(sub?.preferred_location || '');
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function saveProfile() {
    if (!fullName.trim()) { showToast('Nome é obrigatório'); return; }
    if (phone && !isValidPhone(phone)) { showToast('Telefone inválido'); return; }

    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phone || null })
        .eq('id', profile.id);
      if (profileError) throw profileError;

      const currentEmail = session?.user?.email;
      if (email && email !== currentEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        showToast('Confirmação enviada para o novo email');
      }

      if (subscription) {
        console.log('Saving location:', location, 'Sub ID:', subscription.id);
        const { data, error: locError } = await supabase.from('subscriptions')
          .update({ preferred_location: location || null })
          .eq('id', subscription.id)
          .select();
        console.log('Location result:', data, 'Error:', locError);
      }

      if (fetchProfile) await fetchProfile(profile.id);

      if (!email || email === currentEmail) {
        showToast('Perfil atualizado!');
      }

      setEditing(false);
    } catch (err) {
      showToast('Erro: ' + err.message);
    }
    setSaving(false);
  }

  function cancelEdit() {
    setFullName(profile.full_name || '');
    setPhone(profile.phone || '');
    setEmail(session?.user?.email || '');
    setLocation(subscription?.preferred_location || '');
    setEditing(false);
  }

  const plan = subscription?.plans;
  const trainerName = subscription?.trainers?.profiles?.full_name;

  return (
    <div className="page">
      <div className="page-header animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="page-title">Perfil</p>
        {!editing && (
          <div onClick={() => setEditing(true)}
            style={{ cursor: 'pointer', padding: '8px 14px', borderRadius: 'var(--radius-full)', background: 'var(--sand-50)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--green-500)' }}>
            <Pencil size={14} /> Editar
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="animate-in delay-1" style={{ textAlign: 'center', marginBottom: 24 }}>
        <Avatar name={profile?.full_name} size="lg" />
        <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 12 }}>{fullName || profile?.full_name}</p>
        {plan && <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 2 }}>{plan.name}</p>}
      </div>

      {/* Fields */}
      {editing ? (
        <>
          <div className="animate-in" style={{ marginBottom: 14 }}>
            <label className="input-label"><User size={12} style={{ display: 'inline', marginRight: 4 }} />Nome completo</label>
            <input className="input-field" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome completo" />
          </div>

          <div className="animate-in" style={{ marginBottom: 14 }}>
            <label className="input-label"><Mail size={12} style={{ display: 'inline', marginRight: 4 }} />Email</label>
            <input className="input-field" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" type="email" />
            <p style={{ fontSize: 11, color: 'var(--sand-400)', marginTop: 4 }}>Alterar o email exigirá confirmação no novo endereço.</p>
          </div>

          <div className="animate-in" style={{ marginBottom: 14 }}>
            <label className="input-label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Telefone</label>
            <input className="input-field" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} placeholder="(11) 99999-9999" type="tel" />
          </div>

          <div className="animate-in" style={{ marginBottom: 16 }}>
            <label className="input-label"><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Local preferido de treino</label>
            <input className="input-field" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Smart Fit Paulista" />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ flex: 1, opacity: saving ? 0.7 : 1 }}>
              {saving ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} /> : <><Save size={16} /> Salvar</>}
            </button>
            <button className="btn btn-outline" onClick={cancelEdit} style={{ flex: 0.5 }}>
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <div className="animate-in delay-2" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--sand-100)', marginBottom: 20 }}>
          {[
            ['Nome', fullName || '—'],
            ['Email', email || '—'],
            ['Telefone', phone || 'Não informado'],
            ['Personal', trainerName || 'Nenhum'],
            ['Plano', plan ? `${plan.name} — ${formatBRL(plan.price_cents)}` : 'Sem plano'],
            ['Local de treino', location || 'Não informado'],
          ].map(([label, value], i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--sand-100)' : 'none', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14, color: 'var(--sand-500)', flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 14, textAlign: 'right', marginLeft: 12, wordBreak: 'break-word', color: value === 'Não informado' || value === 'Nenhum' || value === 'Sem plano' ? 'var(--sand-400)' : undefined, fontStyle: value === 'Não informado' || value === 'Nenhum' ? 'italic' : undefined }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Links */}
      <div className="animate-in delay-3" style={{ marginBottom: 12 }} onClick={() => nav('/feedback')}>
        <div style={{ cursor: 'pointer', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--sand-100)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <MessageSquare size={18} color="var(--sand-500)" />
          <div>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Feedback & Suporte</p>
            <p style={{ fontSize: 12, color: 'var(--sand-400)' }}>Envie sugestões ou reporte problemas</p>
          </div>
        </div>
      </div>

      <div className="animate-in delay-3" style={{ marginBottom: 20 }} onClick={() => nav('/legal?tab=terms')}>
        <div style={{ cursor: 'pointer', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--sand-100)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={18} color="var(--sand-500)" />
          <div>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Termos & Privacidade</p>
            <p style={{ fontSize: 12, color: 'var(--sand-400)' }}>Termos de uso e política de privacidade</p>
          </div>
        </div>
      </div>

      <button className="btn btn-danger animate-in delay-4" onClick={signOut}>
        <LogOut size={18} /> Sair da conta
      </button>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--green-800)', color: 'white', padding: '10px 20px',
          borderRadius: 'var(--radius-full)', fontSize: 14, zIndex: 200, maxWidth: '90%', textAlign: 'center',
        }}>{toast}</div>
      )}

      <BottomNav role="student" />
    </div>
  );
}