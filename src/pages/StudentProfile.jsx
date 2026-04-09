import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BottomNav, Avatar } from '../components/Shared';
import { formatPhone, isValidPhone } from '../lib/validation';
import { LogOut, Save, Phone, FileText, MessageSquare, Shield, Mail, User } from 'lucide-react';

export default function TrainerProfile() {
  const { profile, signOut, fetchProfile, session } = useAuth();
  const nav = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setEmail(session?.user?.email || '');
      loadBio();
    }
  }, [profile]);

  async function loadBio() {
    const { data } = await supabase
      .from('trainers')
      .select('bio')
      .eq('id', profile.id)
      .single();
    setBio(data?.bio || '');
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
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone || null,
        })
        .eq('id', profile.id);
      if (profileError) throw profileError;

      // Update email in auth if changed
      const currentEmail = session?.user?.email;
      if (email && email !== currentEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        showToast('Email de confirmação enviado para o novo endereço');
      }

      // Update trainers table (bio)
      const { error: trainerError } = await supabase
        .from('trainers')
        .update({ bio: bio.trim() || null })
        .eq('id', profile.id);
      if (trainerError) throw trainerError;

      // Refresh profile in context
      if (fetchProfile) await fetchProfile(profile.id);

      if (!email || email === currentEmail) {
        showToast('Perfil atualizado!');
      }
    } catch (err) {
      showToast('Erro: ' + err.message);
    }
    setSaving(false);
  }

  return (
    <div className="page">
      <div className="page-header animate-in">
        <p className="page-title">Perfil</p>
      </div>

      {/* Avatar */}
      <div className="animate-in delay-1" style={{ textAlign: 'center', marginBottom: 24 }}>
        <Avatar name={profile?.full_name} size="lg" bg="var(--blue-bg)" color="var(--blue)" />
        <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 12 }}>{profile?.full_name}</p>
        <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 2 }}>Personal Trainer</p>
      </div>

      {/* Editable fields */}
      <div className="animate-in delay-2" style={{ marginBottom: 14 }}>
        <label className="input-label"><User size={12} style={{ display: 'inline', marginRight: 4 }} />Nome completo</label>
        <input className="input-field" value={fullName} onChange={e => setFullName(e.target.value)}
          placeholder="Seu nome completo" />
      </div>

      <div className="animate-in delay-2" style={{ marginBottom: 14 }}>
        <label className="input-label"><Mail size={12} style={{ display: 'inline', marginRight: 4 }} />Email</label>
        <input className="input-field" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="seu@email.com" type="email" />
        <p style={{ fontSize: 11, color: 'var(--sand-400)', marginTop: 4 }}>
          Alterar o email exigirá confirmação no novo endereço.
        </p>
      </div>

      <div className="animate-in delay-2" style={{ marginBottom: 14 }}>
        <label className="input-label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Telefone</label>
        <input className="input-field" value={phone}
          onChange={e => setPhone(formatPhone(e.target.value))}
          placeholder="(11) 99999-9999" type="tel" />
        <p style={{ fontSize: 11, color: 'var(--sand-400)', marginTop: 4 }}>
          Seus alunos poderão ver este número para contato.
        </p>
      </div>

      <div className="animate-in delay-2" style={{ marginBottom: 16 }}>
        <label className="input-label"><FileText size={12} style={{ display: 'inline', marginRight: 4 }} />Sobre você</label>
        <textarea className="input-field" value={bio} onChange={e => setBio(e.target.value)}
          placeholder="Ex: CREF 012345-G/SP. Especialista em hipertrofia e emagrecimento. 5 anos de experiência."
          rows={3} style={{ resize: 'vertical', minHeight: 80, lineHeight: 1.5 }} />
      </div>

      <button className="btn btn-primary animate-in delay-3" onClick={saveProfile}
        disabled={saving} style={{ opacity: saving ? 0.7 : 1, marginBottom: 20 }}>
        {saving ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} />
          : <><Save size={16} /> Salvar alterações</>}
      </button>

      {/* Links */}
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

      <div className="animate-in delay-3" style={{ marginBottom: 20 }}
        onClick={() => nav('/legal?tab=terms')}>
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

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--green-800)', color: 'white', padding: '10px 20px',
          borderRadius: 'var(--radius-full)', fontSize: 14, zIndex: 200,
          maxWidth: '90%', textAlign: 'center',
        }}>{toast}</div>
      )}

      <BottomNav role="trainer" />
    </div>
  );
}