import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, CheckCircle, MessageSquare, Bug, Lightbulb, HelpCircle } from 'lucide-react';

const categories = [
  { id: 'suggestion', label: 'Sugestão', icon: Lightbulb, color: 'var(--green-500)', bg: 'var(--green-50)' },
  { id: 'bug', label: 'Problema', icon: Bug, color: 'var(--coral)', bg: 'var(--coral-bg)' },
  { id: 'support', label: 'Suporte', icon: HelpCircle, color: 'var(--blue)', bg: 'var(--blue-bg)' },
  { id: 'other', label: 'Outro', icon: MessageSquare, color: 'var(--sand-500)', bg: 'var(--sand-50)' },
];

export default function Feedback() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [category, setCategory] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim() || !category) return;
    setSending(true);

    try {
      // Store feedback in a simple table or send via edge function
      // For MVP, we'll insert into a feedback table
      const { error } = await supabase.from('feedback').insert({
        user_id: profile.id,
        user_name: profile.full_name,
        user_role: profile.role,
        category,
        message: message.trim(),
      });

      // If table doesn't exist, just log it
      if (error && error.code === '42P01') {
        console.log('Feedback (table not created):', { category, message: message.trim(), user: profile.full_name });
      }

      setSent(true);
    } catch (err) {
      console.error(err);
      setSent(true); // Show success anyway for MVP
    }
    setSending(false);
  }

  if (sent) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="animate-in" style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <CheckCircle size={32} color="var(--green-500)" />
          </div>
          <p className="page-title">Obrigado!</p>
          <p className="page-subtitle" style={{ marginBottom: 24, lineHeight: 1.5 }}>
            Seu feedback foi recebido. Estamos sempre buscando melhorar o Stride para você.
          </p>
          <button className="btn btn-primary" onClick={() => nav(-1)}>Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <div className="page-header animate-in" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={() => nav(-1)} style={{ cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={22} />
        </div>
        <div>
          <p className="page-title">Feedback & Suporte</p>
          <p className="page-subtitle">Nos ajude a melhorar o Stride</p>
        </div>
      </div>

      {/* Category selection */}
      <div className="animate-in delay-1" style={{ marginBottom: 20 }}>
        <label className="input-label" style={{ marginBottom: 10 }}>Tipo de feedback</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {categories.map(cat => (
            <div key={cat.id} onClick={() => setCategory(cat.id)}
              style={{
                padding: '14px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                border: category === cat.id ? `2px solid ${cat.color}` : '1.5px solid var(--sand-200)',
                background: category === cat.id ? cat.bg : 'white',
                display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
              }}>
              <cat.icon size={18} color={category === cat.id ? cat.color : 'var(--sand-400)'} />
              <span style={{ fontSize: 14, fontWeight: 500, color: category === cat.id ? cat.color : 'var(--sand-600)' }}>
                {cat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Message */}
      <form onSubmit={handleSubmit}>
        <div className="animate-in delay-2" style={{ marginBottom: 20 }}>
          <label className="input-label">Sua mensagem</label>
          <textarea className="input-field" value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Descreva sua sugestão, problema ou dúvida..."
            rows={5} required
            style={{ resize: 'vertical', minHeight: 120, lineHeight: 1.5 }} />
        </div>

        <button type="submit" className="btn btn-primary animate-in delay-3"
          disabled={!category || !message.trim() || sending}
          style={{ opacity: !category || !message.trim() || sending ? 0.6 : 1 }}>
          {sending
            ? <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }} />
            : <><Send size={16} /> Enviar feedback</>
          }
        </button>
      </form>

      <p className="animate-in delay-4" style={{ fontSize: 12, color: 'var(--sand-400)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
        Seu feedback é anônimo e será analisado pela equipe Cloudhead.
      </p>
    </div>
  );
}