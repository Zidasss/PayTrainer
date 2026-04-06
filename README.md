# FitAgenda — MVP

Aplicativo PWA para personal trainers gerenciarem alunos, agenda e pagamentos recorrentes com taxa de 5% da plataforma.

## Stack

- **Frontend**: React 18 + Vite (PWA — funciona como app no celular)
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions, RLS)
- **Pagamentos**: Stripe Connect Express (cobrança recorrente + split automático de 5%)
- **Deploy**: Vercel / Netlify (frontend) + Supabase Cloud (backend)

---

## Guia de Deploy Completo (passo a passo)

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project** e escolha a região `South America (São Paulo)`
3. Anote a **URL** e **anon key** (em Settings > API)
4. Vá em **SQL Editor** e cole todo o conteúdo do arquivo `supabase/migrations/001_schema.sql`, depois clique **Run**

### 2. Configurar Stripe

1. Crie uma conta em [stripe.com](https://stripe.com)
2. Ative o modo **Test** primeiro para testes
3. Em **Developers > API keys**, copie a **Secret key** (`sk_test_...`)
4. Vá em **Settings > Connect** e ative o Stripe Connect
5. Em Connect Settings, configure:
   - Tipo da plataforma: **Software platform**
   - País: **Brasil**
   - Moeda: **BRL**

### 3. Configurar Edge Functions no Supabase

```bash
# Instalar CLI do Supabase
npm install -g supabase

# Login
supabase login

# Linkar ao projeto
supabase link --project-ref YOUR_PROJECT_REF

# Definir secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_XXXXX
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXXXX

# Deploy das functions
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
```

### 4. Configurar Webhook do Stripe

1. No painel Stripe, vá em **Developers > Webhooks**
2. Adicione um endpoint:
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
   - Eventos: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `checkout.session.completed`
3. Copie o **Signing secret** (`whsec_...`) e salve como secret no Supabase

### 5. Configurar Authentication no Supabase

1. Em **Authentication > Providers**, verifique que Email está habilitado
2. Em **Authentication > URL Configuration**:
   - Site URL: `https://seu-dominio.vercel.app`
   - Redirect URLs: `https://seu-dominio.vercel.app/*`

### 6. Deploy do Frontend

```bash
# Clonar e instalar
cd fitagenda
npm install

# Criar arquivo .env
cp .env.example .env
# Editar .env com suas credenciais do Supabase

# Testar localmente
npm run dev

# Build para produção
npm run build
```

**Deploy no Vercel:**
1. Faça push do código para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com), conecte o repo
3. Adicione as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

**Ou deploy no Netlify:**
1. Faça push para GitHub
2. Em [netlify.com](https://netlify.com), conecte o repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Adicione as variáveis de ambiente

### 7. Instalar como App no Celular

O FitAgenda é uma PWA. Para instalar:

**iPhone (Safari):**
1. Abra o site no Safari
2. Toque no botão de compartilhar (↑)
3. Toque em "Adicionar à Tela Inicial"

**Android (Chrome):**
1. Abra o site no Chrome
2. Toque no menu (⋮)
3. Toque em "Adicionar à tela inicial"

---

## Fluxo de Uso

### Personal Trainer (primeiro uso):
1. Criar conta como "Personal"
2. Configurar recebimento via Stripe (será redirecionado para o onboarding)
3. Criar seus planos (ex: 2x R$700, 3x R$900, 4x R$1000)
4. Configurar disponibilidade na agenda (ícone ⚙️ na página de agenda)
5. Compartilhar link de convite com alunos

### Aluno:
1. Abrir link de convite recebido do personal
2. Criar conta como "Aluno"
3. Escolher plano e pagar (cartão de crédito/débito)
4. Agendar aulas nos horários disponíveis
5. Sugerir local de treino

---

## Monetização

- **5% de taxa** sobre cada transação (cobrada automaticamente pelo Stripe Connect)
- O personal recebe 95% diretamente na conta Stripe dele
- Você recebe 5% na sua conta Stripe principal (a conta da plataforma)

---

## Estrutura do Projeto

```
fitagenda/
├── index.html
├── vite.config.js
├── package.json
├── .env.example
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── styles/global.css
│   ├── lib/supabase.js
│   ├── contexts/AuthContext.jsx
│   ├── components/Shared.jsx
│   └── pages/
│       ├── AuthPage.jsx          # Login / Cadastro
│       ├── JoinTrainer.jsx       # Link de convite
│       ├── StudentHome.jsx       # Home do aluno
│       ├── StudentSchedule.jsx   # Agendamento
│       ├── StudentPayment.jsx    # Pagamentos
│       ├── StudentProfile.jsx    # Perfil do aluno
│       ├── TrainerHome.jsx       # Dashboard do personal
│       ├── TrainerSchedule.jsx   # Agenda do personal
│       ├── TrainerStudents.jsx   # Lista de alunos
│       ├── TrainerFinance.jsx    # Finanças
│       └── TrainerPlans.jsx      # Gerenciar planos
└── supabase/
    ├── migrations/
    │   └── 001_schema.sql        # Schema do banco
    └── functions/
        ├── stripe-checkout/      # Criar sessões de pagamento
        │   └── index.ts
        └── stripe-webhook/       # Receber eventos do Stripe
            └── index.ts
```

---

## Modo Stripe Test

Para testes, use cartões de teste do Stripe:
- **Sucesso**: `4242 4242 4242 4242`
- **Recusado**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0000 0000 3220`
- Qualquer data futura e qualquer CVC

---

## Ir para Produção

1. No Stripe, ative o modo **Live** e pegue as chaves de produção
2. Atualize os secrets no Supabase com as chaves live
3. Crie novo webhook apontando para a mesma URL
4. Teste o fluxo completo com um pagamento real pequeno
