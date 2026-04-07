import { useState } from 'react';
import { CalendarDays, CreditCard, MapPin, Clock, ChevronRight, ClipboardList, Users, DollarSign, Link2 } from 'lucide-react';

export default function OnboardingTutorial({ role, onComplete }) {
  const [step, setStep] = useState(0);

  const studentSteps = [
    {
      icon: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green-500)" strokeWidth="2" strokeLinecap="round"><path d="M6 4v16m12-16v16M2 8h4m12 0h4M2 16h4m12 0h4"/></svg>,
      color: 'var(--green-500)', bg: 'var(--green-50)',
      title: 'Bem-vindo ao Stride!',
      desc: 'Aqui você agenda aulas com seu personal trainer, paga online e acompanha tudo em um só lugar.',
    },
    {
      icon: CalendarDays, color: 'var(--green-500)', bg: 'var(--green-50)',
      title: 'Agende suas aulas',
      desc: 'Na aba Agenda, veja os horários disponíveis. Toque nos horários livres para marcar suas aulas da semana.',
    },
    {
      icon: Clock, color: 'var(--coral)', bg: 'var(--coral-bg)',
      title: 'Política de cancelamento',
      desc: 'Cancele aulas com até 2 horas de antecedência. Após isso, a aula é contada do seu plano.',
    },
    {
      icon: CreditCard, color: 'var(--blue)', bg: 'var(--blue-bg)',
      title: 'Pagamento automático',
      desc: 'Cadastre seu cartão na aba Pagamento. A cobrança é automática todo mês.',
    },
    {
      icon: MapPin, color: 'var(--coral)', bg: 'var(--coral-bg)',
      title: 'Escolha onde treinar',
      desc: 'Informe o local do treino ao agendar. Seu personal poderá aprovar ou sugerir outro lugar.',
    },
  ];

  const trainerSteps = [
    {
      icon: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green-500)" strokeWidth="2" strokeLinecap="round"><path d="M6 4v16m12-16v16M2 8h4m12 0h4M2 16h4m12 0h4"/></svg>,
      color: 'var(--green-500)', bg: 'var(--green-50)',
      title: 'Bem-vindo ao Stride!',
      desc: 'Gerencie seus alunos, agenda e pagamentos de forma simples e automatizada.',
    },
    {
      icon: ClipboardList, color: 'var(--green-500)', bg: 'var(--green-50)',
      title: 'Crie seus planos',
      desc: 'Na home, toque em "Meus Planos" e crie os planos que seus alunos poderão assinar.',
    },
    {
      icon: CalendarDays, color: 'var(--blue)', bg: 'var(--blue-bg)',
      title: 'Configure sua disponibilidade',
      desc: 'Na Agenda, toque em "Editar" e marque os horários que você atende.',
    },
    {
      icon: Link2, color: 'var(--green-500)', bg: 'var(--green-50)',
      title: 'Convide seus alunos',
      desc: 'Copie seu link de convite na home e envie por WhatsApp. Seus alunos se inscrevem e agendam.',
    },
    {
      icon: DollarSign, color: 'var(--coral)', bg: 'var(--coral-bg)',
      title: 'Receba automaticamente',
      desc: 'Configure o Stripe na home. Os pagamentos caem na sua conta em até 2 dias úteis.',
    },
    {
      icon: Users, color: 'var(--blue)', bg: 'var(--blue-bg)',
      title: 'Acompanhe tudo',
      desc: 'Veja alunos ativos, finanças e acompanhe sua receita e a taxa da plataforma.',
    },
  ];

  const steps = role === 'trainer' ? trainerSteps : studentSteps;
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const IconComponent = current.icon;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'white', zIndex: 1000,
      display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto',
    }}>
      <div style={{ padding: '16px 24px 0', display: 'flex', gap: 4 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? 'var(--green-500)' : 'var(--sand-200)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ padding: '12px 24px 0', textAlign: 'right' }}>
        <span onClick={onComplete} style={{ fontSize: 13, color: 'var(--sand-400)', cursor: 'pointer' }}>Pular</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div key={step} className="animate-in">
          <div style={{
            width: 80, height: 80, borderRadius: 'var(--radius-xl)', background: current.bg,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28,
          }}>
            {typeof IconComponent === 'function' && IconComponent.length === 0
              ? <IconComponent />
              : <IconComponent size={40} color={current.color} />}
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600,
            marginBottom: 12, color: 'var(--green-900)',
          }}>{current.title}</h2>

          <p style={{ fontSize: 15, color: 'var(--sand-500)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
            {current.desc}
          </p>
        </div>
      </div>

      <div style={{ padding: '0 24px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {steps.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 3,
              background: i === step ? 'var(--green-500)' : 'var(--sand-200)',
              cursor: 'pointer', transition: 'all 0.3s',
            }} />
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => isLast ? onComplete() : setStep(s => s + 1)} style={{ fontSize: 16, padding: 16 }}>
          {isLast ? 'Começar a usar' : 'Próximo'} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}