import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BottomNav, Avatar } from '../components/Shared';
import { formatPhone, isValidPhone } from '../lib/validation';
import { LogOut, Save, Phone, FileText, MessageSquare, Shield, Mail, User, Pencil, DollarSign } from 'lucide-react';

export default function TrainerProfile() {
  const { profile, signOut, fetchProfile, session } = useAuth();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [extraClassPrice, setExtraClassPrice] = useState('');
  const [allowExtraClasses, setAllowExtraClasses] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setEmail(session?.user?.email || '');
      loadTrainerData();
    }
  }, [profile]);

  async function loadTrainerData() {
    const { data } = await supabase
      .from('trainers')
      .select('bio, extra_class_price, allow_extra_classes')
      .eq('id', profile.id)
      .single();
    setBio(data?.bio || '');
    setExtraClassPrice(data?.extra_class_price ? (data.extra_class_price / 100).toString() : '');
    setAllowExtraClasses(data?.allow_extra_classes !== false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function toggleExtraClasses() {
    const newValue = !allowExtraClasses;
    setAllowExtraClasses(newValue);
    await supabase
      .from('trainers')
      .update({ allow_extra_classes: newValue })
      .eq('id', profile.id);
    showToast(newValue ? 'Aulas extras liberadas' : 'Aulas extras bloqueadas');
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

      const trainerUpdate = {
        bio: bio.trim() || null,
        allow_extra_classes: allowExtraClasses,
      };
      if (extraClassPrice) {
        trainerUpdate.extra_class_price = Math.round(parseFloat(extraClassPrice) * 100);
      }

      const { error: trainerError } = await supabase
        .from('trainers')
        .update(trainerUpdate)
        .eq('id', profile.id);
      if (trainerError) throw trainerError;

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
    loadTrainerData();
    setEditing(false);
  }

  const extraPriceDisplay = extraClassPrice ? `R$ ${parseFloat(extraClassPrice).toFixed(2).replace('.', ',')}` : 'Não definido';

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
        <Avatar name={profile?.full_name} size="lg" bg="var(--blue-bg)" color="var(--blue)" />
        <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 12 }}>{fullName || profile?.full_name}</p>
        <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 2 }}>Personal Trainer</p>
      </div>

      {/* Extra classes toggle - always visible */}
      <div className="animate-in delay-2" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 18px', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--sand-100)', marginBottom: 16,
      }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 500 }}>Aulas extras</p>
          <p style={{ fontSize: 12, color: 'var(--sand-400)', marginTop: 2 }}>
            {allowExtraClasses ? 'Alunos podem agendar além do plano' : 'Bloqueado para todos os alunos'}
          </p>
        </div>
        <div onClick={toggleExtraClasses} style={{
          width: 48, height: 28, borderRadius: 14, cursor: 'pointer',
          background: allowExtraClasses ? 'var(--green-500)' : 'var(--sand-300)',
          position: 'relative', transition: 'background 0.2s',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%', background: 'white',
            position: 'absolute', top: 3,
            left: allowExtraClasses ? 23 : 3,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }} />
        </div>
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
            <p style={{ fontSize: 11, color: 'var(--sand-400)', marginTop: 4 }}>Seus alunos poderão ver este número para contato.</p>
          </div>

          <div className="animate-in" style={{ marginBottom: 14 }}>
            <label className="input-label"><DollarSign size={12} style={{ display: 'inline', marginRight: 4 }} />Valor da aula extra (R$)</label>
            <input className="input-field" value={extraClassPrice} onChange={e => setExtraClassPrice(e.target.value)}
              placeholder="150,00" type="number" step="0.01" />
            <p style={{ fontSize: 11, color: 'var(--sand-400)', marginTop: 4 }}>
              Valor cobrado quando o aluno agendar aulas além do plano.
            </p>
          </div>

          <div className="animate-in" style={{ marginBottom: 16 }}>
            <label className="input-label"><FileText size={12} style={{ display: 'inline', marginRight: 4 }} />Sobre você</label>
            <textarea className="input-field" value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Ex: CREF 012345-G/SP. Especialista em hipertrofia e emagrecimento."
              rows={3} style={{ resize: 'vertical', minHeight: 80, lineHeight: 1.5 }} />
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
            ['Aula extra', extraPriceDisplay],
            ['Sobre', bio || 'Não informado'],
          ].map(([label, value], i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--sand-100)' : 'none', alignItems: 'flex-Zapt' }}>
              <span style={{ fontSize: 14, color: 'var(--sand-500)', flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 14, textAlign: 'right', marginLeft: 12, wordBreak: 'break-word', color: value === 'Não informado' || value === 'Não definido' ? 'var(--sand-400)' : undefined, fontStyle: value === 'Não informado' || value === 'Não definido' ? 'italic' : undefined }}>{value}</span>
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

      <BottomNav role="trainer" />
    </div>
  );
}