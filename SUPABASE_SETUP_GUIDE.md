# 🚀 Guia Completo de Migração e Integração Supabase (Postgres) — IMPORTHOUR©

Este guia detalha o passo a passo completo para conectar o sistema **MeliOfertas (IMPORTHOUR©)** ao **Supabase (PostgreSQL)**, migrando a estrutura de dados de usuários, assinaturas, canais do WhatsApp, ofertas disparadas e configurações de afiliados.

---

## 1. O que é o Supabase?
O Supabase é um backend de código aberto baseado no **PostgreSQL**, que oferece banco de dados relacional, autenticação OAuth (Google, GitHub, etc.), gerenciamento de usuários (Auth), armazenamento de arquivos e APIs em tempo real.

---

## 2. Variáveis de Ambiente (`.env`)

Adicione as credenciais do seu projeto Supabase no arquivo `.env` do servidor (Hostinger / Cloud) ou localmente:

```env
# Supabase Frontend / Client Credentials
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Backend Service Credentials
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# PostgreSQL Direct Connection String (Connection Pooling ou Direta)
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJECT-REF].supabase.co:5432/postgres
```

---

## 3. Scripts SQL para Criação do Banco de Dados

Acesse o **SQL Editor** no painel do Supabase (`https://supabase.com/dashboard/project/[REF]/sql`) e execute a estrutura completa de tabelas abaixo:

### 3.1 Tabela de Planos de Assinatura (`subscription_plans`)
```sql
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id VARCHAR(50) PRIMARY KEY, -- 'MENSAL', 'SEMESTRAL', 'ANUAL', 'VITALICIO'
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  interval VARCHAR(20) NOT NULL, -- 'mensal', 'semestral', 'anual', 'vitalicio'
  discount_percentage INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Carga inicial de planos
INSERT INTO public.subscription_plans (id, name, price, interval, discount_percentage, features) VALUES
('MENSAL', 'Plano Mensal Start', 49.90, 'mensal', 0, '["Automação de Disparos", "Acesso aos Canais WhatsApp", "Filtros de Desconto"]'),
('SEMESTRAL', 'Plano Semestral Pro', 239.40, 'semestral', 20, '["Todos do Start", "Desconto de 20%", "Suporte Prioritário", "Exportação de Histórico"]'),
('ANUAL', 'Plano Anual Elite', 399.00, 'anual', 33, '["Todos do Pro", "Isenção Especial de Monitoramento", "Acesso ao Módulo ML Offer Hunter", "Relatórios Financeiros"]'),
('VITALICIO', 'Plano Vitalício Founder', 997.00, 'vitalicio', 50, '["Acesso Perpétuo sem Mensalidades", "Todos os Recursos Futuros", "Canal VIP Telegram", "Garantia de Uptime"]')
ON CONFLICT (id) DO NOTHING;
```

### 3.2 Tabela de Usuários e Assinantes (`users`)
```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- Vínculo com a tabela auth.users do Supabase Auth
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(20) DEFAULT 'SUBSCRIBER' CHECK (role IN ('ADMIN', 'SUBSCRIBER')),
  
  -- Vínculo com Assinatura e Planos
  plan_id VARCHAR(50) REFERENCES public.subscription_plans(id) DEFAULT 'MENSAL',
  status VARCHAR(30) DEFAULT 'PENDENTE' CHECK (status IN ('ATIVO', 'CANCELADO', 'RECONQUISTA_3M', 'EXPIRADO', 'PENDENTE')),
  
  -- Métricas Financeiras e Prazos
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMP WITH TIME ZONE,
  total_paid DECIMAL(10, 2) DEFAULT 0.00,
  discount_applied INTEGER DEFAULT 0,
  is_lifetime_exempt_from_monitoring BOOLEAN DEFAULT false,
  
  -- Retenção e Regras
  cancellation_requested_at TIMESTAMP WITH TIME ZONE,
  reengagement_deadline TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
```

### 3.3 Tabela de Canais do WhatsApp (`whatsapp_channels`)
```sql
CREATE TABLE IF NOT EXISTS public.whatsapp_channels (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'CHANNEL',
  invite_link TEXT,
  members_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ONLINE',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3.4 Tabela de Histórico de Disparos de Ofertas (`dispatched_offers`)
```sql
CREATE TABLE IF NOT EXISTS public.dispatched_offers (
  id VARCHAR(100) PRIMARY KEY,
  product_id VARCHAR(100),
  title VARCHAR(500) NOT NULL,
  original_price DECIMAL(10, 2),
  discounted_price DECIMAL(10, 2),
  discount_percentage INTEGER,
  affiliate_link TEXT NOT NULL,
  channel_id VARCHAR(100) REFERENCES public.whatsapp_channels(id),
  channel_name VARCHAR(255),
  status VARCHAR(30) DEFAULT 'ENVIADO',
  clicks_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  estimated_commission DECIMAL(10, 2) DEFAULT 0.00,
  dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dispatched_offers_dispatched_at ON public.dispatched_offers(dispatched_at DESC);
```

### 3.5 Tabela de Configuração de Afiliados e Tema (`affiliate_config`)
```sql
CREATE TABLE IF NOT EXISTS public.affiliate_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  affiliate_tag VARCHAR(100) DEFAULT 'ofertastop_app',
  custom_domain VARCHAR(255) DEFAULT 'm.ofertastop.com.br',
  theme_accent VARCHAR(30) DEFAULT 'BLUE',
  marketplace_accounts JSONB DEFAULT '{}'::jsonb,
  brand_voice JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT single_row_config CHECK (id = 1)
);
```

---

## 4. Configuração de Autenticação Real com Google no Supabase

Para ativar o botão **"Entrar com Google"** via Supabase Auth:

1. Acesse o **Google Cloud Console** (`https://console.cloud.google.com/`).
2. Vá em **APIs & Services > Credentials** e crie uma chave **OAuth 2.0 Client ID**.
3. Em **Authorized Redirect URIs**, insira o URL do Supabase Auth:
   `https://[SEU-PROJECT-REF].supabase.co/auth/v1/callback`
4. Acesse o **Supabase Dashboard** > **Authentication** > **Providers** > **Google**.
5. Cole o **Client ID** e o **Client Secret** do Google e ative a opção **Enable Google Provider**.
6. Em **Authentication** > **URL Configuration**, defina o **Site URL** com a URL do seu aplicativo (ex: `https://seu-dominio.com.br` ou `https://ais-dev-...run.app`).

---

## 5. Validação da Autenticação no Código

A integração com o cliente Supabase já foi implementada e validada em:
- `src/lib/supabase.ts`: Inicialização do cliente Supabase e função `signInWithGoogle()`.
- `src/components/LoginModal.tsx` e `LoginScreen.tsx`: Botão de login do Google integrado com Supabase.
- `src/App.tsx`: Event listener `supabase.auth.onAuthStateChange` para gerenciar a sessão ativa e definir permissões de Administrador (`ADMIN`) e Assinante (`SUBSCRIBER`).

---

## 6. Comandos de Migração de Dados do LocalStorage para PostgreSQL

Para popular o banco com os dados mockados/locais existentes, você pode executar o seguinte bloco de carga via SQL Editor no Supabase:

```sql
-- Inserção dos usuários base (com perfil Admin e Assinantes)
INSERT INTO public.users (id, name, email, phone, role, plan_id, status, total_paid) VALUES
('a0000000-0000-0000-0000-000000000001', 'Gregorio Admin', 'gregoriojr2003@gmail.com', '+55 11 98888-7777', 'ADMIN', 'VITALICIO', 'ATIVO', 997.00),
('a0000000-0000-0000-0000-000000000002', 'Carlos Silva', 'carlos.silva@email.com', '+55 11 97654-3210', 'SUBSCRIBER', 'SEMESTRAL', 'ATIVO', 239.40),
('a0000000-0000-0000-0000-000000000003', 'Mariana Souza', 'mariana.souza@email.com', '+55 21 98765-4321', 'SUBSCRIBER', 'MENSAL', 'ATIVO', 49.90)
ON CONFLICT (email) DO NOTHING;

-- Inserção dos canais WhatsApp
INSERT INTO public.whatsapp_channels (id, name, type, invite_link, members_count, is_default) VALUES
('ch-1', '🔥 Canal Oficial Promoções Meli', 'CHANNEL', 'https://whatsapp.com/channel/0029Va901823748291', 14250, true),
('ch-2', '⚡ Grupo VIP Super Ofertas Tech', 'GROUP', 'https://chat.whatsapp.com/B901823748291A', 1024, false)
ON CONFLICT (id) DO NOTHING;
```

---

## 7. Prevenção de Tela Branca no Deploy Hostinger (Caminho Relativo de Assets)

Para evitar erros de tela branca ao carregar o aplicativo em subdiretórios ou domínios da Hostinger:

1. **Base Relativa no `vite.config.ts`**: Configurado `base: './'` para garantir que o Vite resolva arquivos JavaScript e CSS dinamicamente independentemente de a aplicação estar hospedada na raiz (`/`) ou em uma subpasta (`/app/` ou `/robos/`).
2. **Arquivo `.htaccess` em `/public`**: Regras de regravação do Apache pré-configuradas para redirecionar rotas SPA para o `index.html` sem quebrar o carregamento dos assets.
3. **PWA Manifest Relativo**: Atualizado `<link rel="manifest" href="./manifest.json" />` para evitar erros 404 em subpastas.

---
**IMPORTHOUR© — Sistema de Automação de Ofertas e Gestão de Assinantes**

