import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Legal() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'privacy');

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <div className="page-header animate-in" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={() => nav(-1)} style={{ cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={22} />
        </div>
        <p key={tab} className="page-title animate-in">{tab === 'privacy' ? 'Política de Privacidade' : 'Termos de Uso'}</p>
      </div>

      {/* Tabs */}
      <div className="animate-in delay-1" style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        <div onClick={() => setTab('privacy')}
          style={{ flex: 1, padding: '10px 0', textAlign: 'center', fontSize: 14, fontWeight: 500, cursor: 'pointer', borderBottom: tab === 'privacy' ? '2px solid var(--green-500)' : '2px solid transparent', color: tab === 'privacy' ? 'var(--green-500)' : 'var(--sand-400)' }}>
          Privacidade
        </div>
        <div onClick={() => setTab('terms')}
          style={{ flex: 1, padding: '10px 0', textAlign: 'center', fontSize: 14, fontWeight: 500, cursor: 'pointer', borderBottom: tab === 'terms' ? '2px solid var(--green-500)' : '2px solid transparent', color: tab === 'terms' ? 'var(--green-500)' : 'var(--sand-400)' }}>
          Termos de Uso
        </div>
      </div>

      <div key={tab} className="animate-in delay-2" style={{ fontSize: 14, color: 'var(--sand-600)', lineHeight: 1.8 }}>
        {tab === 'privacy' ? <PrivacyContent /> : <TermsContent />}
      </div>

      <div style={{ marginTop: 32, padding: '16px 0', borderTop: '1px solid var(--sand-100)', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'var(--sand-400)' }}>Stride é um produto Cloudhead</p>
        <p style={{ fontSize: 11, color: 'var(--sand-400)', marginTop: 4 }}>Dúvidas: gustavo.zavadniakk@gmail.com</p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--green-900)', margin: '0 0 8px' }}>{title}</h3>
      {children}
    </div>
  );
}

function PrivacyContent() {
  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--sand-400)', marginBottom: 20 }}>Última atualização: Abril de 2026</p>

      <p style={{ marginBottom: 16 }}>
        A Cloudhead, empresa responsável pelo aplicativo Stride, está comprometida com a proteção dos dados pessoais dos seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e compartilhamos suas informações.
      </p>

      <Section title="1. Dados coletados">
        <p>Ao utilizar o Stride, podemos coletar os seguintes dados pessoais:</p>
        <p style={{ margin: '8px 0 4px', fontWeight: 500 }}>Dados fornecidos por você:</p>
        <p style={{ paddingLeft: 12 }}>• Nome completo</p>
        <p style={{ paddingLeft: 12 }}>• Endereço de email</p>
        <p style={{ paddingLeft: 12 }}>• Número de telefone (opcional)</p>
        <p style={{ paddingLeft: 12 }}>• Informações de perfil profissional (para personal trainers)</p>
        <p style={{ margin: '8px 0 4px', fontWeight: 500 }}>Dados gerados pelo uso do serviço:</p>
        <p style={{ paddingLeft: 12 }}>• Registros de agendamento de aulas (datas, horários, locais)</p>
        <p style={{ paddingLeft: 12 }}>• Histórico de pagamentos e assinaturas</p>
        <p style={{ paddingLeft: 12 }}>• Feedbacks e mensagens de suporte enviadas</p>
        <p style={{ margin: '8px 0 4px', fontWeight: 500 }}>Dados de pagamento:</p>
        <p style={{ paddingLeft: 12 }}>• Os dados do seu cartão de crédito ou débito são processados exclusivamente pela Stripe, Inc., nosso parceiro de pagamentos. A Cloudhead não armazena, acessa ou processa dados de cartão em seus servidores.</p>
      </Section>

      <Section title="2. Finalidade do uso dos dados">
        <p>Utilizamos seus dados exclusivamente para:</p>
        <p style={{ paddingLeft: 12 }}>• Criar e manter sua conta no Stride</p>
        <p style={{ paddingLeft: 12 }}>• Possibilitar o agendamento de aulas entre alunos e personal trainers</p>
        <p style={{ paddingLeft: 12 }}>• Processar cobranças e repasses de pagamentos</p>
        <p style={{ paddingLeft: 12 }}>• Enviar notificações relevantes sobre aulas, pagamentos e atualizações do serviço</p>
        <p style={{ paddingLeft: 12 }}>• Fornecer suporte técnico e responder feedbacks</p>
        <p style={{ paddingLeft: 12 }}>• Melhorar a experiência do usuário e a qualidade do serviço</p>
      </Section>

      <Section title="3. Compartilhamento de dados">
        <p>A Cloudhead não vende, aluga ou comercializa seus dados pessoais. Compartilhamos informações apenas com:</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Stripe, Inc.</strong> — para processamento seguro de pagamentos</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Supabase</strong> — como provedor de infraestrutura e banco de dados</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Google</strong> — caso você opte pelo login via Google</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Seu personal trainer ou alunos vinculados</strong> — nome, horários de aula e local de treino são compartilhados para viabilizar o serviço</p>
      </Section>

      <Section title="4. Armazenamento e segurança">
        <p>Seus dados são armazenados em servidores seguros operados pela Supabase, com criptografia em trânsito e em repouso. Dados de pagamento são processados pela Stripe com certificação PCI-DSS Nível 1, o mais alto padrão de segurança da indústria de pagamentos.</p>
        <p style={{ marginTop: 8 }}>Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou destruição.</p>
      </Section>

      <Section title="5. Seus direitos">
        <p>Como titular dos dados, você tem direito a:</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Acessar</strong> seus dados pessoais armazenados</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Corrigir</strong> dados incompletos ou desatualizados (via aba Perfil)</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Solicitar a exclusão</strong> da sua conta e dados pessoais</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Revogar consentimento</strong> a qualquer momento</p>
        <p style={{ marginTop: 8 }}>Para exercer qualquer desses direitos, entre em contato pelo canal de Feedback & Suporte do app ou envie email para gustavo.zavadniakk@gmail.com.</p>
      </Section>

      <Section title="6. Cookies e rastreamento">
        <p>O Stride não utiliza cookies de rastreamento ou publicidade. Utilizamos apenas armazenamento local (localStorage) para manter sua sessão ativa e preferências de uso.</p>
      </Section>

      <Section title="7. Menores de idade">
        <p>O Stride não é destinado a menores de 18 anos. Não coletamos intencionalmente dados de menores. Caso tome conhecimento de que um menor cadastrou-se no serviço, entre em contato para que possamos remover a conta.</p>
      </Section>

      <Section title="8. Alterações nesta política">
        <p>A Cloudhead poderá atualizar esta Política de Privacidade periodicamente. Alterações significativas serão comunicadas por notificação no app ou email. O uso continuado do Stride após as alterações constitui aceite da nova política.</p>
      </Section>

      <Section title="9. Contato">
        <p>Para dúvidas, sugestões ou solicitações relacionadas à privacidade:</p>
        <p style={{ marginTop: 8 }}><strong>Cloudhead</strong></p>
        <p>Email: gustavo.zavadniakk@gmail.com</p>
        <p>Canal: Feedback & Suporte (dentro do app Stride)</p>
      </Section>
    </div>
  );
}

function TermsContent() {
  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--sand-400)', marginBottom: 20 }}>Última atualização: Abril de 2026</p>

      <p style={{ marginBottom: 16 }}>
        Estes Termos de Uso regulam o acesso e a utilização do aplicativo Stride, desenvolvido e operado pela Cloudhead. Ao criar uma conta ou utilizar o Stride, você declara ter lido, compreendido e concordado integralmente com estes termos.
      </p>

      <Section title="1. Definições">
        <p style={{ paddingLeft: 12 }}>• <strong>Stride</strong>: plataforma de agendamento e pagamento de aulas de personal training.</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Cloudhead</strong>: empresa desenvolvedora e operadora do Stride.</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Usuário</strong>: qualquer pessoa que crie uma conta no Stride, seja como aluno ou personal trainer.</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Personal Trainer</strong>: profissional de educação física que utiliza o Stride para gerenciar alunos, agenda e pagamentos.</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Aluno</strong>: pessoa que contrata serviços de personal training por meio do Stride.</p>
      </Section>

      <Section title="2. Sobre o serviço">
        <p>O Stride é uma plataforma que facilita a conexão entre personal trainers e alunos, oferecendo funcionalidades de agendamento de aulas, gestão de planos e processamento de pagamentos. O Stride não emprega, contrata ou supervisiona personal trainers — atuando exclusivamente como intermediador tecnológico.</p>
      </Section>

      <Section title="3. Cadastro e conta">
        <p style={{ paddingLeft: 12 }}>• Ao criar uma conta, o usuário garante que as informações fornecidas são verdadeiras e atualizadas.</p>
        <p style={{ paddingLeft: 12 }}>• Cada pessoa física deve possuir apenas uma conta.</p>
        <p style={{ paddingLeft: 12 }}>• O usuário é responsável por manter a confidencialidade de suas credenciais de acesso.</p>
        <p style={{ paddingLeft: 12 }}>• A Cloudhead reserva-se o direito de suspender ou encerrar contas que violem estes termos.</p>
      </Section>

      <Section title="4. Obrigações do aluno">
        <p style={{ paddingLeft: 12 }}>• O pagamento da assinatura é recorrente e automático, conforme o plano escolhido.</p>
        <p style={{ paddingLeft: 12 }}>• Cancelamentos de aulas agendadas devem ser feitos com no mínimo <strong>10 horas de antecedência</strong>.</p>
        <p style={{ paddingLeft: 12 }}>• Aulas não canceladas dentro do prazo são contabilizadas no plano e não serão reembolsadas.</p>
        <p style={{ paddingLeft: 12 }}>• O aluno pode cancelar seu plano a qualquer momento pela aba Pagamento. O acesso permanece ativo até o fim do período já pago.</p>
        <p style={{ paddingLeft: 12 }}>• Em caso de inadimplência (3 ou mais falhas de pagamento), o agendamento de aulas será bloqueado até a regularização.</p>
      </Section>

      <Section title="5. Obrigações do personal trainer">
        <p style={{ paddingLeft: 12 }}>• O personal trainer é o único responsável pela qualidade, segurança e adequação dos serviços prestados aos alunos.</p>
        <p style={{ paddingLeft: 12 }}>• É obrigatório manter registro profissional ativo (CREF) quando exigido pela legislação.</p>
        <p style={{ paddingLeft: 12 }}>• A configuração da conta Stripe é de responsabilidade do personal trainer e é indispensável para o recebimento dos pagamentos.</p>
        <p style={{ paddingLeft: 12 }}>• O personal deve manter sua agenda atualizada para evitar conflitos de agendamento.</p>
      </Section>

      <Section title="6. Pagamentos e taxas">
        <p style={{ paddingLeft: 12 }}>• O Stride cobra uma <strong>taxa de 8% (oito por cento)</strong> sobre cada transação processada pela plataforma.</p>
        <p style={{ paddingLeft: 12 }}>• Essa taxa cobre custos de operação do app, infraestrutura tecnológica, processamento de pagamentos e equipe de suporte.</p>
        <p style={{ paddingLeft: 12 }}>• Os valores pagos pelos alunos são repassados ao personal trainer via Stripe em até <strong>2 (dois) dias úteis</strong> após a confirmação do pagamento.</p>
        <p style={{ paddingLeft: 12 }}>• A Cloudhead não se responsabiliza por atrasos no repasse decorrentes do processamento bancário ou da Stripe.</p>
        <p style={{ paddingLeft: 12 }}>• Não há custo de adesão, mensalidade ou taxa fixa para uso do Stride.</p>
      </Section>

      <Section title="7. Reembolsos e disputas">
        <p style={{ paddingLeft: 12 }}>• Solicitações de reembolso devem ser direcionadas primeiramente ao personal trainer.</p>
        <p style={{ paddingLeft: 12 }}>• O Stride pode mediar conflitos entre alunos e personal trainers através do canal de Feedback & Suporte, mas não é obrigado a conceder reembolsos.</p>
        <p style={{ paddingLeft: 12 }}>• Em caso de fraude comprovada, a Cloudhead poderá intervir e tomar as medidas necessárias, incluindo a suspensão de contas envolvidas.</p>
      </Section>

      <Section title="8. Limitação de responsabilidade">
        <p>A Cloudhead atua exclusivamente como intermediadora tecnológica e:</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Não se responsabiliza</strong> pela qualidade ou adequação dos treinos ministrados.</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Não se responsabiliza</strong> por lesões, danos físicos ou qualquer prejuízo à saúde decorrente dos treinos.</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Não se responsabiliza</strong> por conflitos pessoais ou comerciais entre alunos e personal trainers.</p>
        <p style={{ paddingLeft: 12 }}>• <strong>Não garante</strong> disponibilidade ininterrupta do serviço, embora se empenhe para manter a plataforma estável.</p>
      </Section>

      <Section title="9. Propriedade intelectual">
        <p>Todo o conteúdo do Stride — incluindo design, código-fonte, logotipos, textos e funcionalidades — é de propriedade exclusiva da Cloudhead e protegido pelas leis de propriedade intelectual. É proibida a reprodução, distribuição ou modificação sem autorização prévia.</p>
      </Section>

      <Section title="10. Cancelamento de conta">
        <p style={{ paddingLeft: 12 }}>• O usuário pode solicitar o cancelamento da sua conta a qualquer momento pelo canal de Feedback & Suporte ou pela aba Perfil.</p>
        <p style={{ paddingLeft: 12 }}>• Pagamentos pendentes no momento do cancelamento serão processados normalmente.</p>
        <p style={{ paddingLeft: 12 }}>• Após o cancelamento, os dados pessoais serão excluídos conforme descrito na Política de Privacidade.</p>
      </Section>

      <Section title="11. Alterações nos termos">
        <p>A Cloudhead poderá alterar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas aos usuários com antecedência. O uso continuado do Stride após a notificação constitui aceite dos novos termos.</p>
      </Section>

      <Section title="12. Legislação aplicável">
        <p>Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer litígio será submetido ao foro da comarca de Curitiba/PR.</p>
      </Section>

      <Section title="13. Contato">
        <p>Para dúvidas ou solicitações:</p>
        <p style={{ marginTop: 8 }}><strong>Cloudhead</strong></p>
        <p>Email: gustavo.zavadniakk@gmail.com</p>
        <p>Canal: Feedback & Suporte (dentro do app Stride)</p>
      </Section>
    </div>
  );
}