import { useNavigate } from 'react-router-dom';
import { CalendarDays, CreditCard, Clock, ArrowRight, Check, MessageCircle, Shield, Zap, Users, Star } from 'lucide-react';

function StrideLogo() {
  return (
    <svg width="52" height="52" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="128" fill="#0D9E6D"/>
      <g transform="translate(256,256)" fill="white">
        <rect x="-80" y="-120" width="28" height="240" rx="14"/>
        <rect x="-120" y="-40" width="108" height="28" rx="14"/>
        <rect x="52" y="-120" width="28" height="240" rx="14"/>
        <rect x="12" y="-40" width="108" height="28" rx="14"/>
      </g>
    </svg>
  );
}

function PhoneMockup() {
  return (
    <div style={{
      width: 220, height: 420, borderRadius: 32, background: '#1a1a1a',
      padding: '12px 8px', position: 'relative',
      boxShadow: '0 24px 48px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)',
      transform: 'perspective(800px) rotateY(-5deg) rotateX(2deg)',
    }}>
      <div style={{ width: 80, height: 24, background: '#1a1a1a', borderRadius: '0 0 16px 16px', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }} />
      <div style={{
        width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden',
        background: 'linear-gradient(180deg, #0D9E6D 0%, #087a54 40%, #f5f5f0 40%)',
      }}>
        <div style={{ padding: '16px 16px 0', display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: 9, fontWeight: 600 }}>
          <span>9:41</span>
          <span>●●●</span>
        </div>
        <div style={{ padding: '14px 16px', color: 'white' }}>
          <p style={{ fontSize: 9, opacity: 0.7 }}>Olá,</p>
          <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)' }}>Gustavo</p>
        </div>
        <div style={{ margin: '0 10px', background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 12px', color: 'white' }}>
          <p style={{ fontSize: 8, opacity: 0.7 }}>Plano atual</p>
          <p style={{ fontSize: 12, fontWeight: 600 }}>3x na semana</p>
          <div style={{ marginTop: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 3 }}>
            <div style={{ width: '66%', background: 'white', borderRadius: 4, height: 3 }} />
          </div>
          <p style={{ fontSize: 7, opacity: 0.6, marginTop: 3 }}>2 de 3 aulas usadas</p>
        </div>
        <div style={{ padding: '12px 10px' }}>
          <p style={{ fontSize: 9, fontWeight: 600, color: '#333', marginBottom: 6 }}>Próximas aulas</p>
          {['Seg • 08:00', 'Qua • 10:00', 'Sex • 07:00'].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', borderBottom: '1px solid #eee' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#f0f9f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 7, color: '#0D9E6D', fontWeight: 600 }}>{['S', 'Q', 'S'][i]}</span>
              </div>
              <p style={{ fontSize: 8, fontWeight: 500, color: '#333' }}>{t} — Treino</p>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 10, right: 10, display: 'flex', justifyContent: 'space-around', padding: '8px 0', background: 'white', borderRadius: 12, boxShadow: '0 -1px 4px rgba(0,0,0,0.05)' }}>
          {['🏠', '📅', '💳', '👤'].map((e, i) => (
            <span key={i} style={{ fontSize: 12, opacity: i === 0 ? 1 : 0.4 }}>{e}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const nav = useNavigate();

  return (
    <div style={{ background: 'var(--sand-bg)', minHeight: '100dvh', overflow: 'hidden' }}>

      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 24px', maxWidth: 960, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StrideLogo />
          <span style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-display)' }}>Stride</span>
        </div>
        <button onClick={() => nav('/auth')} style={{
          background: 'none', border: '1.5px solid var(--sand-200)', borderRadius: 'var(--radius-full)',
          padding: '8px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: 'var(--green-800)',
          fontFamily: 'inherit',
        }}>
          Entrar
        </button>
      </nav>

      <section style={{
        maxWidth: 960, margin: '0 auto', padding: '40px 24px 20px',
        display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 320px' }}>
          <div className="animate-in" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--green-50)',
            borderRadius: 'var(--radius-full)', padding: '6px 14px', marginBottom: 16,
          }}>
            <Zap size={14} color="var(--green-500)" />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--green-600)' }}>A plataforma do personal trainer</span>
          </div>

          <h1 className="animate-in" style={{
            fontSize: 'clamp(32px, 6vw, 48px)', fontFamily: 'var(--font-display)', fontWeight: 700,
            lineHeight: 1.15, marginBottom: 16, color: 'var(--green-900)',
          }}>
            Agende, pague e treine.<br />
            <span style={{ color: 'var(--green-500)' }}>Tudo em um só lugar.</span>
          </h1>

          <p className="animate-in delay-1" style={{
            fontSize: 16, color: 'var(--sand-600)', lineHeight: 1.6, marginBottom: 28, maxWidth: 420,
          }}>
            O Stride conecta personal trainers e alunos com agendamento inteligente, pagamento automático e gestão completa. Sem planilhas, sem WhatsApp.
          </p>

          <div className="animate-in delay-2" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => nav('/auth')} className="btn btn-primary" style={{
              padding: '14px 28px', fontSize: 16, borderRadius: 12,
              boxShadow: '0 4px 16px rgba(13,158,109,0.25)',
            }}>
              Começar grátis <ArrowRight size={18} />
            </button>
            <button onClick={() => {
              document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' });
            }} className="btn btn-outline" style={{ padding: '14px 24px', fontSize: 16, borderRadius: 12 }}>
              Como funciona
            </button>
          </div>

          <div className="animate-in delay-3" style={{ display: 'flex', gap: 20, marginTop: 24, flexWrap: 'wrap' }}>
            {['Sem taxas de cadastro', 'Cancele quando quiser', 'Teste grátis'].map((t, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--sand-500)' }}>
                <Check size={14} color="var(--green-500)" /> {t}
              </span>
            ))}
          </div>
        </div>

        <div className="animate-in delay-2" style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', width: '100%', maxWidth: 280 }}>
          <PhoneMockup />
        </div>
      </section>

      <section style={{ maxWidth: 960, margin: '40px auto 0', padding: '0 24px' }}>
        <div className="animate-in delay-3" style={{
          display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap',
          padding: '20px 0', borderTop: '1px solid var(--sand-200)', borderBottom: '1px solid var(--sand-200)',
        }}>
          {[['Pagamento seguro', 'Via Stripe'], ['Agenda inteligente', 'Automática'], ['Sem compromisso', 'Cancele grátis']].map(([top, bottom], i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 120 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--green-800)' }}>{top}</p>
              <p style={{ fontSize: 12, color: 'var(--sand-400)', marginTop: 2 }}>{bottom}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" style={{ maxWidth: 960, margin: '0 auto', padding: '56px 24px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-500)', textTransform: 'uppercase', letterSpacing: 1 }}>Para alunos</span>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 8, color: 'var(--green-900)' }}>
            Tudo que você precisa para treinar
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { icon: <CalendarDays size={24} />, title: 'Agende suas aulas', desc: 'Veja os horários disponíveis do seu personal e marque com um toque. Simples assim.' },
            { icon: <CreditCard size={24} />, title: 'Pague automaticamente', desc: 'Cadastre seu cartão uma vez. A cobrança é automática todo mês, sem preocupação.' },
            { icon: <Clock size={24} />, title: 'Gerencie com facilidade', desc: 'Cancele ou reagende aulas a qualquer momento, sem complicação ou burocracia.' },
            { icon: <MessageCircle size={24} />, title: 'Contato direto', desc: 'Fale com seu personal pelo WhatsApp direto pelo app. Comunicação rápida e prática.' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '28px 24px', borderRadius: 'var(--radius-lg)', background: 'white',
              border: '1px solid var(--sand-100)', transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-500)', marginBottom: 16 }}>
                {item.icon}
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{item.title}</p>
              <p style={{ fontSize: 14, color: 'var(--sand-500)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 56px' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--green-700) 0%, var(--green-900) 100%)',
          borderRadius: 24, padding: 'clamp(32px, 5vw, 48px)', color: 'white',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>Para personal trainers</span>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 8, marginBottom: 28 }}>
            Simplifique sua gestão
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { icon: <CreditCard size={20} />, text: 'Receba pagamentos automáticos no cartão' },
              { icon: <CalendarDays size={20} />, text: 'Agenda organizada sem WhatsApp' },
              { icon: <Users size={20} />, text: 'Dashboard com todos os alunos e status' },
              { icon: <Shield size={20} />, text: 'Veja quem pagou e quem está devendo' },
              { icon: <Star size={20} />, text: 'Página pública como link na bio' },
              { icon: <Zap size={20} />, text: 'Seus alunos agendam sozinhos' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.5, marginTop: 6 }}>{item.text}</p>
              </div>
            ))}
          </div>

          <button onClick={() => nav('/auth')} style={{
            marginTop: 32, background: 'white', color: 'var(--green-700)', border: 'none',
            borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-display)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            Criar conta gratuita <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 56px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--green-900)' }}>
            WhatsApp vs Stride
          </h2>
          <p style={{ fontSize: 15, color: 'var(--sand-500)', marginTop: 8 }}>Por que profissionais estão migrando</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div style={{ padding: '28px 24px', borderRadius: 'var(--radius-lg)', background: 'white', border: '1px solid var(--sand-200)' }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--sand-500)' }}>📱 WhatsApp</p>
            {['Agenda confusa em mensagens', 'Cobrar aluno manualmente', 'Sem controle de inadimplência', 'Horários se perdem no chat', 'Sem histórico de pagamentos', 'Não sabe quem pagou'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--sand-100)' : 'none' }}>
                <span style={{ color: 'var(--coral)', fontSize: 16 }}>✕</span>
                <span style={{ fontSize: 14, color: 'var(--sand-500)' }}>{t}</span>
              </div>
            ))}
          </div>

          <div style={{
            padding: '28px 24px', borderRadius: 'var(--radius-lg)',
            background: 'var(--green-50)', border: '2px solid var(--green-400)', position: 'relative',
          }}>
            <span style={{
              position: 'absolute', top: -12, right: 16, background: 'var(--green-500)',
              color: 'white', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 10,
            }}>RECOMENDADO</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <StrideLogo />
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--green-800)' }}>Stride</p>
            </div>
            {['Agenda visual e organizada', 'Cobrança automática no cartão', 'Dashboard de inadimplentes', 'Aluno agenda sozinho', 'Histórico completo de pagamentos', 'Controle total em tempo real'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--green-200)' : 'none' }}>
                <Check size={16} color="var(--green-500)" />
                <span style={{ fontSize: 14, color: 'var(--green-700)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 40px', textAlign: 'center' }}>
        <div style={{
          background: 'var(--sand-50)', borderRadius: 24, padding: 'clamp(32px, 5vw, 48px)',
          border: '1px solid var(--sand-200)',
        }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 12, color: 'var(--green-900)' }}>
            Pronto para simplificar seus treinos?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--sand-500)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Crie sua conta em menos de 1 minuto. Sem taxas de cadastro, sem compromisso.
          </p>
          <button onClick={() => nav('/auth')} className="btn btn-primary" style={{
            padding: '16px 32px', fontSize: 16, borderRadius: 12,
            boxShadow: '0 4px 16px rgba(13,158,109,0.25)',
          }}>
            Criar conta gratuita <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <footer style={{
        maxWidth: 960, margin: '0 auto', padding: '24px',
        borderTop: '1px solid var(--sand-200)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--sand-400)' }}>Feito por</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sand-600)' }}>Cloudhead</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span onClick={() => nav('/legal?tab=privacy')} style={{ fontSize: 13, color: 'var(--sand-400)', cursor: 'pointer', textDecoration: 'underline' }}>Privacidade</span>
          <span onClick={() => nav('/legal?tab=terms')} style={{ fontSize: 13, color: 'var(--sand-400)', cursor: 'pointer', textDecoration: 'underline' }}>Termos de Uso</span>
        </div>
      </footer>
    </div>
  );
}