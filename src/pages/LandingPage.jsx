import { useNavigate } from 'react-router-dom';
import { CalendarDays, CreditCard, Clock, ChevronRight, Star } from 'lucide-react';

export default function LandingPage() {
  const nav = useNavigate();

  return (
    <div style={{ minHeight: '100dvh', background: 'white', maxWidth: 480, margin: '0 auto', overflow: 'hidden' }}>
      {/* Hero */}
      <div style={{
        padding: '60px 24px 40px', textAlign: 'center',
        background: 'linear-gradient(180deg, var(--green-50) 0%, white 100%)',
      }}>
        <div className="animate-in" style={{
          width: 72, height: 72, borderRadius: 'var(--radius-xl)', background: 'var(--green-500)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M6 4v16m12-16v16M2 8h4m12 0h4M2 16h4m12 0h4"/>
          </svg>
        </div>

        <h1 className="animate-in delay-1" style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700,
          letterSpacing: -0.5, margin: '0 0 8px', color: 'var(--green-900)',
        }}>
          Stride
        </h1>

        <p className="animate-in delay-2" style={{
          fontSize: 16, color: 'var(--sand-500)', lineHeight: 1.5, margin: '0 0 32px',
        }}>
          Agende, pague e treine.<br />Tudo em um só lugar.
        </p>

        <div className="animate-in delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => nav('/auth?mode=signup')} style={{ fontSize: 16, padding: 16 }}>
            Começar agora <ChevronRight size={18} />
          </button>
          <button className="btn btn-ghost" onClick={() => nav('/auth?mode=login')} style={{ fontSize: 14 }}>
            Já tenho conta — Entrar
          </button>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '32px 24px 20px' }}>
        <p className="animate-in" style={{
          fontSize: 13, fontWeight: 500, color: 'var(--green-500)',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
        }}>
          Como funciona
        </p>
        <h2 className="animate-in" style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginBottom: 24,
        }}>
          Tudo que você precisa para treinar
        </h2>

        {[
          {
            icon: CalendarDays, color: 'var(--green-500)', bg: 'var(--green-50)',
            title: 'Agende suas aulas',
            desc: 'Veja os horários disponíveis do seu personal e marque com um toque.',
          },
          {
            icon: CreditCard, color: 'var(--blue)', bg: 'var(--blue-bg)',
            title: 'Pague automaticamente',
            desc: 'Cadastre seu cartão uma vez. A cobrança é automática todo mês.',
          },
          {
            icon: Clock, color: 'var(--coral)', bg: 'var(--coral-bg)',
            title: 'Gerencie com facilidade',
            desc: 'Cancele ou reagende aulas a qualquer momento, sem complicação.',
          },
        ].map((feature, i) => (
          <div key={i} className={`animate-in delay-${i + 1}`} style={{
            display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)', background: feature.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <feature.icon size={22} color={feature.color} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{feature.title}</p>
              <p style={{ fontSize: 13, color: 'var(--sand-500)', lineHeight: 1.5 }}>{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* For trainers */}
      <div style={{
        margin: '0 24px', padding: '24px 20px', borderRadius: 'var(--radius-lg)',
        background: 'var(--sand-50)', marginBottom: 24,
      }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--green-500)', marginBottom: 4 }}>
          Para personal trainers
        </p>
        <p style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 10 }}>
          Simplifique sua gestão
        </p>
        <div style={{ fontSize: 13, color: 'var(--sand-600)', lineHeight: 1.6 }}>
          {['Receba pagamentos automáticos no cartão', 'Agenda organizada sem WhatsApp', 'Veja quem pagou e quem não pagou', 'Seus alunos agendam sozinhos'].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Star size={12} color="var(--green-500)" fill="var(--green-500)" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 24px 24px', textAlign: 'center' }}>
        <button className="btn btn-primary" onClick={() => nav('/auth?mode=signup')} style={{ marginBottom: 12 }}>
          Criar conta gratuita
        </button>
        <p style={{ fontSize: 12, color: 'var(--sand-400)' }}>
          Sem taxas de cadastro. Sem compromisso.
        </p>
      </div>

      {/* Footer with Cloudhead branding */}
      <div style={{
        padding: '20px 24px 32px', borderTop: '1px solid var(--sand-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <img src="/cloudhead-logo.svg" alt="Cloudhead" style={{ width: 22, height: 22 }} />
        <span style={{ fontSize: 12, color: 'var(--sand-400)' }}>Feito por <span style={{ fontWeight: 500, color: 'var(--sand-500)' }}>Cloudhead</span></span>
      </div>
    </div>
  );
}