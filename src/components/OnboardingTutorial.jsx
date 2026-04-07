import { useState } from 'react';
import { CalendarDays, CreditCard, MapPin, Dumbbell, Clock, ChevronRight, ClipboardList, Users, DollarSign, Link2 } from 'lucide-react';

export default function OnboardingTutorial({ role, onComplete }) {
  const [step, setStep] = useState(0);

  const studentSteps = [
    {
      icon: Dumbbell, color: 'var(--green-500)', bg: 'var(--green-50)',
      title: 'Bem-vindo ao Stride!',
      desc: 'Aqui você agenda aulas com seu personal trainer, paga online e acompanha tudo em um só lugar.',
    },
    {
      icon: CalendarDays, color: 'var(--green-500)', bg: 'var(--green-50)',
      title: 'Agende suas aulas',
      desc: 'Na aba Agenda, você vê os horários disponíveis do seu personal. Toque nos horários livres para marcar suas aulas da semana.',
    },
    {
      icon: Clock, color: 'var(--coral)', bg: 'var(--coral-bg)',
      title: 'Política de cancelamento',
      desc: 'Você pode cancelar aulas com até 2 horas de antecedência. Após isso, a aula é contada do seu plano.',
    },
    {
      icon: CreditCard, color: 'var(--blue)', bg: 'var(--blue-bg)',
      title: 'Pagamento automático',
      desc: 'Cadastre seu cartão na aba Pagamento. A cobrança é automática todo mês — sem preocupação.',
    },
    {
      icon: MapPin, color: 'var(--coral)', bg: 'var(--coral-bg)',
      title: 'Escolha onde treinar',
      desc: 'Informe o local do treino ao agendar. Seu personal verá a sugestão e pode aprovar ou sugerir outro lugar.',
    },
  ];

  const trainerSteps = [
    {
      icon: Dumbbell, color: 'var(--green-500)', bg: 'var(--green-50)',
      title: 'Bem-vindo ao Stride!',
      desc: 'Gerencie seus alunos, agenda e pagamentos de forma simples e automatizada.',
    },
    {
      icon: ClipboardList, color: 'var(--green-500)', bg: 'var(--green-50)',
      title: 'Crie seus planos',
      desc: 'Na sua home, toque em "Meus Planos" e crie os planos que seus alunos poderão assinar (ex: 2x, 3x, 4x por semana).',
    },
    {
      icon: CalendarDays, color: 'var(--blue)', bg: 'var(--blue-bg)',
      title: 'Configure sua disponibilidade',
      desc: 'Na aba Agenda, toque em "Editar" e marque os horários que você atende. Seus alunos só poderão agendar nesses horários.',
    },
    {
      icon: Link2, color: 'var(--green-500)', bg: 'var(--green-50)',
      title: 'Convide seus alunos',
      desc: 'Na home, copie seu link de convite e envie por WhatsApp. Seus alunos criam conta, escolhem o plano e começam a agendar.',
    },
    {
      icon: DollarSign, color: 'var(--coral)', bg: 'var(--coral-bg)',
      title: 'Receba automaticamente',
      desc: 'Configure o recebimento via Stripe na home. Os pagamentos dos alunos caem direto na sua conta bancária em até 2 dias úteis.',
    },
    {
      icon: Users, color: 'var(--blue)', bg: 'var(--blue-bg)',
      title: 'Acompanhe tudo',
      desc: 'Na aba Alunos, veja quem está ativo. Em Finanças, acompanhe quanto recebeu e a taxa da plataforma (5%).',
    },
  ];

  const steps = role === 'trainer' ? trainerSteps : studentSteps;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'white', zIndex: 1000,
      display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto',
    }}>
      {/* Progress bar */}
      <div style={{ padding: '16px 24px 0', display: 'flex', gap: 4 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= step ? 'var(--green-500)' : 'var(--sand-200)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* Skip button */}
      <div style={{ padding: '12px 24px 0', textAlign: 'right' }}>
        <span onClick={onComplete} style={{ fontSize: 13, color: 'var(--sand-400)', cursor: 'pointer' }}>
          Pular tutorial
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div key={step} className="animate-in">
          <div style={{
            width: 80, height: 80, borderRadius: 'var(--radius-xl)', background: current.bg,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28,
          }}>
            <current.icon size={40} color={current.color} />
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600,
            marginBottom: 12, color: 'var(--green-900)',
          }}>
            {current.title}
          </h2>

          <p style={{ fontSize: 15, color: 'var(--sand-500)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
            {current.desc}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: '0 24px 40px' }}>
        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {steps.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 3,
              background: i === step ? 'var(--green-500)' : 'var(--sand-200)',
              cursor: 'pointer', transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <button className="btn btn-primary" onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
          style={{ fontSize: 16, padding: 16 }}>
          {isLast ? 'Começar a usar' : 'Próximo'} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}