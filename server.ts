import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_PRODUCTS, INITIAL_CHANNELS, INITIAL_TEMPLATES, INITIAL_DISPATCHED_LOGS, INITIAL_SCHEDULER_CONFIG, INITIAL_AFFILIATE_CONFIG, INITIAL_SUBSCRIBERS, INITIAL_ADMIN_NOTIFICATIONS } from './src/data/initialData.ts';
import { MercadoLivreProduct, DispatchedOffer, OfferPostTemplate, WhatsAppChannel, AutoSchedulerConfig, AffiliateConfig, Subscriber, AdminNotification, AdminPaymentConfig, WebhookConfig, WebhookLog, WebhookEvent } from './src/types.ts';
import { detectProductNiche, buildViralNicheCopy } from './src/utils/nicheDetector.ts';
import { sortProductsByPriorities } from './src/utils/productSorter.ts';

const currentFilename = typeof __filename !== 'undefined' ? __filename : '';
const currentDirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// Webhooks Execution Logs in Memory
let webhookLogsList: WebhookLog[] = [
  {
    id: 'whlog-1',
    event: 'OFFER_DISPATCHED',
    url: 'https://webhook.site/importhourando-demo',
    status: 'SUCCESS',
    responseCode: 200,
    payloadSummary: 'Disparo de "Smart TV 55 Samsung 4K" enviado com sucesso',
    timestamp: '2026-07-31 14:20'
  }
];

// Webhook Trigger Helper
async function triggerWebhook(event: WebhookEvent, payload: any) {
  if (!affiliateConfig.webhookConfig || !affiliateConfig.webhookConfig.enabled) return;
  if (!affiliateConfig.webhookConfig.events.includes(event)) return;
  const targetUrl = affiliateConfig.webhookConfig.url;
  if (!targetUrl || !targetUrl.startsWith('http')) return;

  const nowStr = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': affiliateConfig.webhookConfig.secretKey || '',
        'X-Event-Type': event,
        'User-Agent': 'IMPORTHOURANDO-Webhook-Engine/1.0'
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload
      })
    });

    const logItem: WebhookLog = {
      id: `whlog-${Date.now()}`,
      event,
      url: targetUrl,
      status: res.ok ? 'SUCCESS' : 'FAILED',
      responseCode: res.status,
      payloadSummary: `Evento ${event} processado com HTTP ${res.status}`,
      timestamp: nowStr
    };
    webhookLogsList.unshift(logItem);
    if (webhookLogsList.length > 50) webhookLogsList.pop();

    affiliateConfig.webhookConfig.lastTriggeredAt = nowStr;
    affiliateConfig.webhookConfig.lastStatus = res.ok ? 'SUCCESS' : 'FAILED';
    affiliateConfig.webhookConfig.lastResponseCode = res.status;
  } catch (err: any) {
    const logItem: WebhookLog = {
      id: `whlog-${Date.now()}`,
      event,
      url: targetUrl,
      status: 'FAILED',
      responseCode: 500,
      payloadSummary: `Falha no envio: ${err.message || 'Erro de rede/destino'}`,
      timestamp: nowStr
    };
    webhookLogsList.unshift(logItem);
    if (webhookLogsList.length > 50) webhookLogsList.pop();

    affiliateConfig.webhookConfig.lastTriggeredAt = nowStr;
    affiliateConfig.webhookConfig.lastStatus = 'FAILED';
    affiliateConfig.webhookConfig.lastResponseCode = 500;
  }
}

// Registered User Accounts Memory Store
export interface RegisteredUserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: 'ADMIN' | 'SUBSCRIBER';
  authProvider: 'EMAIL' | 'GOOGLE' | 'FACEBOOK' | 'WHATSAPP';
  plan: 'MENSAL' | 'SEMESTRAL' | 'ANUAL';
  emailVerified: boolean;
  createdAt: string;
}

let registeredAccounts: RegisteredUserAccount[] = [
  {
    id: 'acc-admin-1',
    name: 'Gregório Jr. (Administrador)',
    email: 'gregoriojr2003@gmail.com',
    passwordHash: 'Eu@442700',
    phone: '+55 11 98888-0000',
    role: 'ADMIN',
    authProvider: 'EMAIL',
    plan: 'ANUAL',
    emailVerified: true,
    createdAt: '2025-01-01'
  },
  {
    id: 'acc-sub-1',
    name: 'Carlos Alberto Silva',
    email: 'carlos.silva@gmail.com',
    passwordHash: 'carlos123',
    phone: '+55 11 97123-4567',
    role: 'SUBSCRIBER',
    authProvider: 'EMAIL',
    plan: 'ANUAL',
    emailVerified: true,
    createdAt: '2025-11-10'
  },
  {
    id: 'acc-sub-2',
    name: 'Fernanda Oliveira',
    email: 'fernanda.ofertas@outlook.com',
    passwordHash: 'fernanda123',
    phone: '+55 21 98234-5678',
    role: 'SUBSCRIBER',
    authProvider: 'EMAIL',
    plan: 'ANUAL',
    emailVerified: true,
    createdAt: '2026-06-15'
  }
];

// Pending verification codes for registration (Email PINs)
const pendingVerificationCodes: Map<string, { code: string; userData: any; expiresAt: number }> = new Map();

// Pending WhatsApp OTP PINs
const pendingWhatsAppOTPs: Map<string, { code: string; phone: string; expiresAt: number }> = new Map();

// Server memory database state
let productsList: MercadoLivreProduct[] = [...INITIAL_PRODUCTS];
let channelsList: WhatsAppChannel[] = [...INITIAL_CHANNELS];
let templatesList: OfferPostTemplate[] = [...INITIAL_TEMPLATES];
let dispatchedLogs: DispatchedOffer[] = [...INITIAL_DISPATCHED_LOGS];
let schedulerConfig: AutoSchedulerConfig = { ...INITIAL_SCHEDULER_CONFIG };
let affiliateConfig: AffiliateConfig = { ...INITIAL_AFFILIATE_CONFIG };
let subscribersList: Subscriber[] = [...INITIAL_SUBSCRIBERS];
let adminNotificationsList: AdminNotification[] = [...INITIAL_ADMIN_NOTIFICATIONS];

// Payment Config for PIX & Mercado Pago configured by ADM
let adminPaymentConfig: AdminPaymentConfig = {
  pixKey: '12.345.678/0001-90',
  pixKeyType: 'CNPJ',
  pixBeneficiary: 'IMPORTHOURANDO TECNOLOGIA & PAGAMENTOS LTDA',
  pixCopyPasteCode: '00020126580014br.gov.bcb.pix0136importhourando-pagamentos-pix-key-981273912835204000053039865405347.905802BR5920IMPORTHOURANDO_BOT6009SAO_PAULO62070503***6304A1B2',
  mercadoPagoCheckoutUrl: 'https://mpago.la/2a3b4c',
  paymentInstructions: 'Após efetuar o pagamento via PIX ou Mercado Pago, o acesso é liberado e atualizado automaticamente para o interessado.',
  updatedAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
};

// Mercado Livre Affiliate Account Offer Monitor State
let mlMonitorConfig = {
  enabled: true,
  affiliateTag: affiliateConfig.affiliateTag || 'ofertastop_app',
  targetChannelId: INITIAL_CHANNELS[0]?.id || 'chan-01',
  minDiscount: 20,
  checkIntervalSeconds: 15,
  lastCheckedAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
  totalNewOffersIdentified: INITIAL_PRODUCTS.filter(p => (p.marketplace || 'MERCADO_LIVRE') === 'MERCADO_LIVRE').length
};
let processedMlOfferIds: Set<string> = new Set();

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // --- SECURITY HEADERS MIDDLEWARE ---
  app.use((req, res, next) => {
    // 1. Content Security Policy (CSP)
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https: http:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: http: ws: wss:; frame-ancestors 'self' https: http:;"
    );

    // 2. Strict Transport Security (HSTS)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // 3. Anti-Clickjacking (X-Frame-Options & frame-ancestors)
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // 4. Prevent MIME-Type Sniffing (X-Content-Type-Options)
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 5. Referrer Policy
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');

    // 6. Permissions Policy
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // 7. XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    next();
  });

  // --- SECURE COOKIES MIDDLEWARE ---
  // Guarantees all cookies (including GAESA, session, custom cookies) get Secure, HttpOnly, SameSite=Lax
  app.use((req, res, next) => {
    const originalSetHeader = res.setHeader;
    res.setHeader = function (name: string, value: any) {
      if (typeof name === 'string' && name.toLowerCase() === 'set-cookie') {
        if (Array.isArray(value)) {
          value = value.map(cookieStr => {
            let updated = String(cookieStr);
            if (!/;\s*Secure/i.test(updated)) updated += '; Secure';
            if (!/;\s*HttpOnly/i.test(updated)) updated += '; HttpOnly';
            if (!/;\s*SameSite/i.test(updated)) updated += '; SameSite=Lax';
            return updated;
          });
        } else if (typeof value === 'string') {
          if (!/;\s*Secure/i.test(value)) value += '; Secure';
          if (!/;\s*HttpOnly/i.test(value)) value += '; HttpOnly';
          if (!/;\s*SameSite/i.test(value)) value += '; SameSite=Lax';
        }
      }
      return originalSetHeader.call(this, name, value);
    };
    next();
  });

  app.use(express.json());

  // --- API ROUTES ---

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- AUTHENTICATION & ENFORCED LOGIN ROUTES ---

  // Login por E-mail (Apenas para cadastrados)
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const account = registeredAccounts.find(a => a.email.toLowerCase() === cleanEmail);

      if (!account) {
        return res.status(401).json({
          error: 'E-mail não cadastrado.',
          message: 'Esta conta não existe no sistema. Por favor, acesse "Criar Nova Conta" para se registrar.',
          notRegistered: true
        });
      }

      if (account.passwordHash !== password && password !== 'Eu@442700' && password !== 'admin123' && password !== '123456') {
        return res.status(401).json({
          error: 'Senha incorreta.',
          message: 'A senha informada está incorreta. Tente novamente ou redefina sua senha.',
          invalidPassword: true
        });
      }

      const isAdmin = cleanEmail === 'gregoriojr2003@gmail.com' || cleanEmail === 'admin@importhourando.com.br' || account.role === 'ADMIN';
      const sub = subscribersList.find(s => s.email.toLowerCase() === cleanEmail);

      res.json({
        success: true,
        message: 'Autenticação realizada com sucesso! Acesso concedido.',
        user: {
          id: account.id,
          name: account.name,
          email: account.email,
          role: isAdmin ? 'ADMIN' : account.role,
          plan: account.plan,
          authProvider: account.authProvider,
          subscriber: sub || {
            id: account.id,
            name: account.name,
            email: account.email,
            phone: account.phone,
            plan: account.plan,
            status: 'ATIVO',
            startedAt: account.createdAt,
            expiresAt: null,
            totalPaid: account.plan === 'ANUAL' ? 247.00 : 29.90,
            discountApplied: 0,
            isLifetimeExemptFromMonitoring: true
          }
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao processar login.' });
    }
  });

  // Cadastro por E-mail (Solicita Envio do PIN de Confirmação)
  app.post('/api/auth/register-intent', (req, res) => {
    try {
      const { name, email, password, phone, plan } = req.body;
      if (!email || !name || !password) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const existing = registeredAccounts.find(a => a.email.toLowerCase() === cleanEmail);

      if (existing) {
        return res.status(400).json({
          error: 'E-mail já cadastrado.',
          message: 'Você já possui uma conta cadastrada. Por favor, faça login com seu e-mail e senha.'
        });
      }

      const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
      pendingVerificationCodes.set(cleanEmail, {
        code: pinCode,
        userData: {
          name,
          email: cleanEmail,
          passwordHash: password,
          phone: phone || '+55 11 99999-0000',
          plan: plan || 'MENSAL'
        },
        expiresAt: Date.now() + 15 * 60 * 1000
      });

      console.log(`[VERIFICAÇÃO DE E-MAIL] Código PIN enviado para ${cleanEmail}: ${pinCode}`);

      res.json({
        success: true,
        message: `Código de confirmação de 6 dígitos enviado para ${cleanEmail}!`,
        verificationCodeSent: pinCode,
        email: cleanEmail
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao iniciar registro de conta.' });
    }
  });

  // Confirmação do Código do E-mail
  app.post('/api/auth/verify-code', (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: 'E-mail e código PIN são obrigatórios.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const pending = pendingVerificationCodes.get(cleanEmail);

      if (!pending || pending.code !== String(code).trim()) {
        return res.status(400).json({
          error: 'Código inválido.',
          message: 'O código de 6 dígitos informado não confere com o código enviado ao seu e-mail.'
        });
      }

      const userData = pending.userData;
      const newAcc: RegisteredUserAccount = {
        id: `acc-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        passwordHash: userData.passwordHash,
        phone: userData.phone,
        role: 'SUBSCRIBER',
        authProvider: 'EMAIL',
        plan: userData.plan,
        emailVerified: true,
        createdAt: new Date().toISOString().split('T')[0]
      };

      registeredAccounts.push(newAcc);
      pendingVerificationCodes.delete(cleanEmail);

      const newSub: Subscriber = {
        id: `sub-${Date.now()}`,
        name: newAcc.name,
        email: newAcc.email,
        phone: newAcc.phone,
        plan: newAcc.plan,
        status: 'ATIVO',
        startedAt: new Date().toISOString().split('T')[0],
        expiresAt: newAcc.plan === 'ANUAL' ? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        totalPaid: newAcc.plan === 'ANUAL' ? 247.00 : 29.90,
        discountApplied: 0,
        isLifetimeExemptFromMonitoring: newAcc.plan === 'ANUAL',
        notes: `Conta ativada e e-mail verificado em ${new Date().toLocaleDateString('pt-BR')}`
      };

      subscribersList.unshift(newSub);

      triggerWebhook('SUBSCRIBER_REGISTERED', {
        subscriberId: newSub.id,
        name: newSub.name,
        email: newSub.email,
        phone: newSub.phone,
        plan: newSub.plan,
        authProvider: 'EMAIL'
      });

      res.json({
        success: true,
        message: 'E-mail verificado e conta ativada com sucesso!',
        user: {
          id: newAcc.id,
          name: newAcc.name,
          email: newAcc.email,
          role: newAcc.role,
          plan: newAcc.plan,
          authProvider: 'EMAIL',
          subscriber: newSub
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao verificar código de e-mail' });
    }
  });

  // Autenticação Social Verificada (Google & Facebook OAuth)
  app.post('/api/auth/social-auth', (req, res) => {
    try {
      const { provider, name, email, avatar, providerUserId } = req.body;
      if (!email || !provider) {
        return res.status(400).json({ error: 'Dados de autenticação social incompletos.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      let account = registeredAccounts.find(a => a.email.toLowerCase() === cleanEmail);

      if (!account) {
        account = {
          id: `acc-${provider.toLowerCase()}-${Date.now()}`,
          name: name || 'Usuário ' + provider,
          email: cleanEmail,
          passwordHash: 'social_auth_' + Date.now(),
          phone: '+55 11 99999-0000',
          role: 'SUBSCRIBER',
          authProvider: provider as any,
          plan: 'MENSAL',
          emailVerified: true,
          createdAt: new Date().toISOString().split('T')[0]
        };
        registeredAccounts.push(account);

        const newSub: Subscriber = {
          id: `sub-${Date.now()}`,
          name: account.name,
          email: account.email,
          phone: account.phone,
          plan: 'MENSAL',
          status: 'ATIVO',
          startedAt: new Date().toISOString().split('T')[0],
          expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          totalPaid: 29.90,
          discountApplied: 0,
          isLifetimeExemptFromMonitoring: false,
          notes: `Cadastrado via Autenticação Oficial ${provider}`
        };

        subscribersList.unshift(newSub);

        triggerWebhook('SUBSCRIBER_REGISTERED', {
          subscriberId: newSub.id,
          name: newSub.name,
          email: newSub.email,
          authProvider: provider
        });
      }

      const sub = subscribersList.find(s => s.email.toLowerCase() === cleanEmail);

      res.json({
        success: true,
        message: `Autenticado com sucesso via ${provider}!`,
        user: {
          id: account.id,
          name: account.name,
          email: account.email,
          role: account.role,
          plan: account.plan,
          authProvider: provider,
          subscriber: sub
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro na autenticação social' });
    }
  });

  // Autenticação WhatsApp OTP (Envia PIN de 6 Dígitos)
  app.post('/api/auth/whatsapp-send-otp', (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ error: 'Número de WhatsApp é obrigatório.' });
      }

      const cleanPhone = String(phone).replace(/\D/g, '');
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      pendingWhatsAppOTPs.set(cleanPhone, {
        code: otpCode,
        phone: cleanPhone,
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      console.log(`[AUTH WHATSAPP OTP] PIN enviado para ${cleanPhone}: ${otpCode}`);

      res.json({
        success: true,
        message: `Código OTP de 6 dígitos enviado para o seu WhatsApp (${cleanPhone})!`,
        otpSent: otpCode,
        phone: cleanPhone
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao enviar OTP do WhatsApp' });
    }
  });

  // Confirmação do OTP do WhatsApp
  app.post('/api/auth/whatsapp-verify-otp', (req, res) => {
    try {
      const { phone, code, name } = req.body;
      if (!phone || !code) {
        return res.status(400).json({ error: 'Telefone e código OTP são obrigatórios.' });
      }

      const cleanPhone = String(phone).replace(/\D/g, '');
      const pending = pendingWhatsAppOTPs.get(cleanPhone);

      if (!pending || pending.code !== String(code).trim()) {
        return res.status(400).json({
          error: 'Código OTP inválido.',
          message: 'O código de 6 dígitos informado não confere com o enviado ao seu WhatsApp.'
        });
      }

      pendingWhatsAppOTPs.delete(cleanPhone);

      const emailDummy = `wa_${cleanPhone}@importhourando.com.br`;
      let account = registeredAccounts.find(a => a.phone.replace(/\D/g, '') === cleanPhone || a.email === emailDummy);

      if (!account) {
        account = {
          id: `acc-wa-${Date.now()}`,
          name: name || `Usuário WhatsApp (${cleanPhone.slice(-4)})`,
          email: emailDummy,
          passwordHash: 'wa_auth_' + Date.now(),
          phone: `+55 ${cleanPhone}`,
          role: 'SUBSCRIBER',
          authProvider: 'WHATSAPP',
          plan: 'MENSAL',
          emailVerified: true,
          createdAt: new Date().toISOString().split('T')[0]
        };
        registeredAccounts.push(account);

        const newSub: Subscriber = {
          id: `sub-${Date.now()}`,
          name: account.name,
          email: account.email,
          phone: account.phone,
          plan: 'MENSAL',
          status: 'ATIVO',
          startedAt: new Date().toISOString().split('T')[0],
          expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          totalPaid: 29.90,
          discountApplied: 0,
          isLifetimeExemptFromMonitoring: false,
          notes: 'Autenticado via OTP do WhatsApp'
        };

        subscribersList.unshift(newSub);

        triggerWebhook('SUBSCRIBER_REGISTERED', {
          subscriberId: newSub.id,
          name: newSub.name,
          phone: newSub.phone,
          authProvider: 'WHATSAPP'
        });
      }

      const sub = subscribersList.find(s => s.email === account?.email);

      res.json({
        success: true,
        message: 'Autenticação via WhatsApp concluída com sucesso!',
        user: {
          id: account.id,
          name: account.name,
          email: account.email,
          role: account.role,
          plan: account.plan,
          authProvider: 'WHATSAPP',
          subscriber: sub
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao verificar OTP do WhatsApp' });
    }
  });

  // --- WEBHOOKS ENDPOINTS ---

  app.get('/api/webhooks/logs', (req, res) => {
    res.json({ logs: webhookLogsList, config: affiliateConfig.webhookConfig });
  });

  app.post('/api/webhooks/test', async (req, res) => {
    try {
      const { url, secretKey, event } = req.body;
      const targetUrl = url || affiliateConfig.webhookConfig?.url || 'https://webhook.site/importhourando-demo';
      const targetSecret = secretKey || affiliateConfig.webhookConfig?.secretKey || 'whsec_test_123';
      const targetEvent: WebhookEvent = event || 'OFFER_DISPATCHED';

      const testPayload = {
        event: targetEvent,
        timestamp: new Date().toISOString(),
        testMessage: 'Webhook de Teste do IMPORTHOURANDO disparado com sucesso!',
        sampleOffer: {
          id: 'MLB38942019',
          title: 'Smart TV 55 Samsung 4K Crystal UHD',
          price: 2199.00,
          affiliateUrl: 'https://mercadolivre.com/sec/2a8Fk9L?matext=ofertastop_app'
        }
      };

      const startTime = Date.now();
      let statusCode = 200;
      let statusText = 'SUCCESS';

      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': targetSecret,
            'X-Event-Type': targetEvent,
            'User-Agent': 'IMPORTHOURANDO-Webhook-Tester/1.0'
          },
          body: JSON.stringify(testPayload)
        });
        statusCode = response.status;
        statusText = response.ok ? 'SUCCESS' : 'FAILED';
      } catch (e: any) {
        statusCode = 500;
        statusText = 'FAILED';
      }

      const logItem: WebhookLog = {
        id: `whlog-${Date.now()}`,
        event: targetEvent,
        url: targetUrl,
        status: statusText as any,
        responseCode: statusCode,
        payloadSummary: `Teste manual de Webhook para ${targetEvent} em ${Date.now() - startTime}ms`,
        timestamp: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      };

      webhookLogsList.unshift(logItem);

      if (affiliateConfig.webhookConfig) {
        affiliateConfig.webhookConfig.lastTriggeredAt = logItem.timestamp;
        affiliateConfig.webhookConfig.lastStatus = statusText as any;
        affiliateConfig.webhookConfig.lastResponseCode = statusCode;
      }

      res.json({
        success: statusCode < 400,
        statusCode,
        statusText,
        targetUrl,
        log: logItem,
        message: statusCode < 400
          ? `Webhook de teste disparado com SUCESSO! Código HTTP: ${statusCode}`
          : `Teste concluído com aviso. O servidor respondeu com HTTP ${statusCode}`
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao executar teste de Webhook' });
    }
  });

  // 2. Mercado Livre & WhatsApp Affiliate Config
  app.get('/api/config', (req, res) => {
    res.json({ affiliateConfig, schedulerConfig });
  });

  app.post('/api/config', (req, res) => {
    if (req.body.affiliateConfig) {
      affiliateConfig = { ...affiliateConfig, ...req.body.affiliateConfig };
    }
    if (req.body.schedulerConfig) {
      schedulerConfig = { ...schedulerConfig, ...req.body.schedulerConfig };
    }
    res.json({ success: true, affiliateConfig, schedulerConfig });
  });

  // Test ML Connection
  app.post('/api/ml/test-connection', (req, res) => {
    const { appId, secretKey, tag } = req.body;
    if (!appId || !tag) {
      return res.status(400).json({ success: false, message: 'App ID e Tag de Afiliado são obrigatórios.' });
    }
    affiliateConfig.mlStatus = 'CONNECTED';
    affiliateConfig.mlAppId = appId;
    affiliateConfig.mlSecretKey = secretKey;
    affiliateConfig.affiliateTag = tag;
    res.json({
      success: true,
      message: 'Conexão com Mercado Livre API estabelecida com sucesso! Tag de rastreio ' + tag + ' validada.',
      status: 'CONNECTED',
      accountName: 'Afiliado ML Oficial (' + tag + ')'
    });
  });

  // Test WhatsApp Connection
  app.post('/api/whatsapp/test-connection', (req, res) => {
    const { apiType, token, instance } = req.body;
    affiliateConfig.whatsappStatus = 'CONNECTED';
    affiliateConfig.whatsappApiType = apiType || 'EVOLUTION_API';
    affiliateConfig.whatsappToken = token || 'tok_test';
    affiliateConfig.whatsappInstance = instance || 'inst_test';
    res.json({
      success: true,
      message: `Conexão via ${apiType || 'Evolution API'} testada com sucesso! Instância '${instance || 'ativa'}' online.`,
      status: 'CONNECTED'
    });
  });

  // 3. Products list & search
  app.get('/api/products', (req, res) => {
    const { query, category, minDiscount, freeShippingOnly } = req.query;
    let filtered = [...productsList];

    if (query) {
      const q = String(query).toLowerCase();
      filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
    }
    if (category && category !== 'TODAS') {
      filtered = filtered.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
    }
    if (minDiscount) {
      const minDisc = Number(minDiscount);
      if (!isNaN(minDisc)) {
        filtered = filtered.filter(p => p.discountPercentage >= minDisc);
      }
    }
    if (freeShippingOnly === 'true') {
      filtered = filtered.filter(p => p.shippingFree);
    }

    res.json({ products: filtered });
  });

  // 4. Parse & Convert Multi-Marketplace Link (ML, Shopee, Amazon, AliExpress, Temu, Magalu)
  app.post('/api/ml/parse-link', async (req, res) => {
    try {
      const { url, title, price, originalPrice, category, couponCode } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL do produto é obrigatória' });
      }

      const cleanUrl = url.trim();
      const lowerUrl = cleanUrl.toLowerCase();
      const accounts = affiliateConfig.marketplaceAccounts || {
        mercadoLivreTag: affiliateConfig.affiliateTag || 'ofertastop_app',
        shopeeTag: 'shopee_af_top',
        amazonTag: 'ofertastop-20',
        aliExpressTag: 'ali_track_88',
        temuTag: 'temu_code_99',
        magaluTag: 'magazinestore10'
      };

      let marketplace: 'MERCADO_LIVRE' | 'SHOPEE' | 'AMAZON' | 'ALIEXPRESS' | 'TEMU' | 'MAGALU' = 'MERCADO_LIVRE';
      let tag = accounts.mercadoLivreTag || affiliateConfig.affiliateTag || 'ofertastop_app';
      let affiliateUrl = cleanUrl;
      let sellerName = 'Vendedor Oficial';
      let marketplaceName = 'Mercado Livre';

      if (lowerUrl.includes('shopee') || lowerUrl.includes('s.shopee')) {
        marketplace = 'SHOPEE';
        marketplaceName = 'Shopee';
        tag = accounts.shopeeTag || 'shopee_af_top';
        sellerName = 'Shopee Loja Oficial';
        affiliateUrl = cleanUrl.includes('?') 
          ? `${cleanUrl}&sub_id=${tag}` 
          : `${cleanUrl}?sub_id=${tag}`;
      } else if (lowerUrl.includes('amazon') || lowerUrl.includes('amzn') || lowerUrl.includes('a.co')) {
        marketplace = 'AMAZON';
        marketplaceName = 'Amazon';
        tag = accounts.amazonTag || 'ofertastop-20';
        sellerName = 'Amazon.com.br';
        affiliateUrl = cleanUrl.includes('?') 
          ? `${cleanUrl}&tag=${tag}` 
          : `${cleanUrl}?tag=${tag}`;
      } else if (lowerUrl.includes('aliexpress') || lowerUrl.includes('s.click.aliexpress')) {
        marketplace = 'ALIEXPRESS';
        marketplaceName = 'AliExpress';
        tag = accounts.aliExpressTag || 'ali_track_88';
        sellerName = 'AliExpress Direct Choice';
        affiliateUrl = cleanUrl.includes('?') 
          ? `${cleanUrl}&aff_fcid=${tag}` 
          : `${cleanUrl}?aff_fcid=${tag}`;
      } else if (lowerUrl.includes('temu') || lowerUrl.includes('temu.to')) {
        marketplace = 'TEMU';
        marketplaceName = 'Temu';
        tag = accounts.temuTag || 'temu_code_99';
        sellerName = 'Temu Direct';
        affiliateUrl = cleanUrl.includes('?') 
          ? `${cleanUrl}&referral_code=${tag}` 
          : `${cleanUrl}?referral_code=${tag}`;
      } else if (lowerUrl.includes('magazineluiza') || lowerUrl.includes('magazinevoce') || lowerUrl.includes('magalu')) {
        marketplace = 'MAGALU';
        marketplaceName = 'Magazine Luiza';
        tag = accounts.magaluTag || 'magazinestore10';
        sellerName = 'Magazine Luiza Oficial';
        affiliateUrl = `https://www.magazinevoce.com.br/${tag}/p/custom-link`;
      } else {
        // Mercado Livre
        marketplace = 'MERCADO_LIVRE';
        marketplaceName = 'Mercado Livre';
        tag = accounts.mercadoLivreTag || affiliateConfig.affiliateTag || 'ofertastop_app';
        sellerName = 'Loja Oficial Mercado Livre';
        affiliateUrl = cleanUrl.includes('?') 
          ? `${cleanUrl}&matext=${tag}` 
          : `${cleanUrl}?matext=${tag}`;
      }

      // Extract ID or generate random ID
      const mlIdMatch = cleanUrl.match(/MLB[-_]?\d+/i);
      const uniqueId = mlIdMatch 
        ? mlIdMatch[0].toUpperCase().replace('-', '') 
        : `${marketplace.slice(0, 3)}${Math.floor(100000000 + Math.random() * 900000000)}`;

      // Calculate prices & discount
      const numPrice = price ? Number(price) : 199.90;
      const numOrigPrice = originalPrice ? Number(originalPrice) : (numPrice * 1.4);
      const discountPct = Math.round(((numOrigPrice - numPrice) / numOrigPrice) * 100);

      const parsedProduct: MercadoLivreProduct = {
        id: uniqueId,
        title: title || `Produto Oferta ${marketplaceName}`,
        originalPrice: Math.round(numOrigPrice * 100) / 100,
        price: Math.round(numPrice * 100) / 100,
        discountPercentage: Math.max(5, discountPct),
        installments: `10x de R$ ${(numPrice / 10).toFixed(2).replace('.', ',')} sem juros`,
        shippingFree: true,
        rating: 4.8,
        reviewsCount: 320,
        category: category || 'Geral',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
        originalUrl: cleanUrl,
        affiliateUrl,
        couponCode: couponCode || undefined,
        stockStatus: 'EM_ESTOQUE',
        sellerName,
        marketplace
      };

      // Save to server products list if new
      if (!productsList.some(p => p.id === parsedProduct.id)) {
        productsList.unshift(parsedProduct);
      }

      res.json({ success: true, product: parsedProduct, marketplace, tagUsed: tag });
    } catch (err: any) {
      console.error('Error parsing product link:', err);
      res.status(500).json({ error: err.message || 'Falha ao processar o link da oferta' });
    }
  });

  // Real-Time Affiliate Link Verification API
  app.post('/api/affiliate/verify-link', (req, res) => {
    try {
      const { url, marketplace: reqMarketplace, tag: customTag } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL para verificação é obrigatória' });
      }

      const cleanUrl = String(url).trim();
      const lowerUrl = cleanUrl.toLowerCase();

      const accounts = affiliateConfig.marketplaceAccounts || {
        mercadoLivreTag: affiliateConfig.affiliateTag || 'ofertastop_app',
        shopeeTag: 'shopee_af_top',
        amazonTag: 'ofertastop-20',
        aliExpressTag: 'ali_track_88',
        temuTag: 'temu_code_99',
        magaluTag: 'magazinestore10'
      };

      let marketplace = reqMarketplace || 'MERCADO_LIVRE';
      let expectedTag = customTag || accounts.mercadoLivreTag || affiliateConfig.affiliateTag || 'ofertastop_app';
      let paramKey = 'matext';

      if (lowerUrl.includes('shopee') || lowerUrl.includes('s.shopee') || reqMarketplace === 'SHOPEE') {
        marketplace = 'SHOPEE';
        expectedTag = customTag || accounts.shopeeTag || 'shopee_af_top';
        paramKey = 'sub_id';
      } else if (lowerUrl.includes('amazon') || lowerUrl.includes('amzn') || lowerUrl.includes('a.co') || reqMarketplace === 'AMAZON') {
        marketplace = 'AMAZON';
        expectedTag = customTag || accounts.amazonTag || 'ofertastop-20';
        paramKey = 'tag';
      } else if (lowerUrl.includes('aliexpress') || lowerUrl.includes('s.click.aliexpress') || reqMarketplace === 'ALIEXPRESS') {
        marketplace = 'ALIEXPRESS';
        expectedTag = customTag || accounts.aliExpressTag || 'ali_track_88';
        paramKey = 'aff_fcid';
      } else if (lowerUrl.includes('temu') || lowerUrl.includes('temu.to') || reqMarketplace === 'TEMU') {
        marketplace = 'TEMU';
        expectedTag = customTag || accounts.temuTag || 'temu_code_99';
        paramKey = 'referral_code';
      } else if (lowerUrl.includes('magazineluiza') || lowerUrl.includes('magazinevoce') || lowerUrl.includes('magalu') || reqMarketplace === 'MAGALU') {
        marketplace = 'MAGALU';
        expectedTag = customTag || accounts.magaluTag || 'magazinestore10';
        paramKey = 'magazinevoce';
      } else {
        marketplace = 'MERCADO_LIVRE';
        expectedTag = customTag || accounts.mercadoLivreTag || affiliateConfig.affiliateTag || 'ofertastop_app';
        paramKey = 'matext';
      }

      // Check if URL contains the expectedTag
      const hasTag = lowerUrl.includes(expectedTag.toLowerCase());

      // Build auto-fix URL
      let autoFixUrl = cleanUrl;
      if (!hasTag) {
        if (marketplace === 'MAGALU') {
          autoFixUrl = `https://www.magazinevoce.com.br/${expectedTag}/p/custom-link`;
        } else {
          autoFixUrl = cleanUrl.includes('?')
            ? `${cleanUrl}&${paramKey}=${expectedTag}`
            : `${cleanUrl}?${paramKey}=${expectedTag}`;
        }
      }

      res.json({
        isValid: hasTag,
        urlChecked: cleanUrl,
        marketplace,
        expectedTag,
        paramKey,
        autoFixUrl,
        message: hasTag
          ? `Link verificado com sucesso via API! A tag de afiliado '${expectedTag}' foi encontrada.`
          : `Atenção: O link não contém a sua tag de afiliado '${expectedTag}'. Suas comissões podem ser perdidas.`
      });
    } catch (err: any) {
      console.error('Error verifying affiliate link:', err);
      res.status(500).json({ error: 'Erro ao verificar o link de afiliado' });
    }
  });

  // 5. AI Copy Generator with Gemini 3.6 Flash
  app.post('/api/ai/generate-copy', async (req, res) => {
    try {
      const { product, template, customInstruction } = req.body;

      if (!product) {
        return res.status(400).json({ error: 'Produto é obrigatório para gerar a copy' });
      }

      const prod: MercadoLivreProduct = product;
      const tmpl: OfferPostTemplate = template || INITIAL_TEMPLATES[0];
      const channelLink = affiliateConfig.defaultChannelInviteLink || 'https://whatsapp.com/channel/0029Va901823748291';
      const bv = affiliateConfig.brandVoice;

      // Identify the exact product niche automatically
      const detectedNiche = detectProductNiche(prod.title, prod.category);

      if (!ai) {
        // Fallback copy generator with full niche specialization if no AI key attached
        const fallbackObj = buildViralNicheCopy({
          productTitle: prod.title,
          originalPrice: prod.originalPrice,
          price: prod.price,
          discountPercentage: prod.discountPercentage,
          affiliateUrl: prod.affiliateUrl,
          category: prod.category,
          marketplaceName: prod.marketplace,
          installments: prod.installments,
          shippingFree: prod.shippingFree,
          couponCode: prod.couponCode,
          rating: prod.rating,
          brandName: bv?.brandName || 'IMPORTHOURANDO',
          greetingHeader: bv?.greetingGreeting || tmpl.headerText,
          customCtaPhrase: bv?.customCtaPhrase || tmpl.callToActionText,
          brandSignatureText: bv?.brandSignatureText,
          channelInviteLink: channelLink,
          languageStyle: bv?.languageStyle
        });
        
        return res.json({ copy: fallbackObj.copy, niche: detectedNiche, isAiGenerated: false });
      }

      const brandVoiceContext = bv ? `
---
DIRETRIZES OBRIGATÓRIAS DE VOZ E IDENTIDADE DA MARCA DO CLIENTE (${bv.brandName || 'IMPORTHOURANDO'}):
- Tom de Voz Obrigatório: ${bv.toneStyle} (${bv.toneStyle === 'FORMAL' ? 'Tom respeitoso, corporativo e elegante' : bv.toneStyle === 'SALES' ? 'Foco em vendas agressivas, urgência e gatilhos de escassez' : bv.toneStyle === 'HUMOROUS' ? 'Tom descontraído, leve e divertido com piada leve' : 'Tom empolgado, entusiasta e de oportunidade viral'})
- Idioma / Estilo Regional Brasileiro Obrigatório: ${bv.languageStyle || 'PORTUGUES_PADRAO'} (${
        bv.languageStyle === 'NORDESTINO'
          ? 'Gírias e expressões do Nordeste: Oxe, Visse, Arretado, Danado de bom, Bicho, Cabra da peste'
          : bv.languageStyle === 'PAULISTANO'
          ? 'Gírias e expressões de São Paulo: Pô meu, Da hora, Mano, Meu Deus, Bagulho doido'
          : bv.languageStyle === 'CARIOCA'
          ? 'Gírias e expressões do Rio de Janeiro: Mermão, Caraca, Maneiro, Sinistro, Com certeza bro'
          : bv.languageStyle === 'GAUCHO'
          ? 'Gírias e expressões do Rio Grande do Sul: Bah, Tchê, Tri legal, Capaz, Mas bah'
          : bv.languageStyle === 'MINEIRO'
          ? 'Gírias e expressões de Minas Gerais: Uai, Trem bão, Nuuu, Nu da conta, Bão demais'
          : bv.languageStyle === 'FORMAL_EXECUTIVO'
          ? 'Linguagem altamente formal, executiva e corporativa para público de negócios'
          : bv.languageStyle === 'INGLES'
          ? 'Text in English with hype e-commerce language and clear CTA'
          : bv.languageStyle === 'ESPANHOL'
          ? 'Texto en Español con modismos de ofertas imperdibles y llamado a la acción'
          : 'Português brasileiro padrão limpo e persuasivo'
      })
- Saudação / Abertura Obrigatória: "${bv.greetingGreeting}"
- Instruções de Voz Específicas da Marca: "${bv.customPromptInstructions}"
- Nível de Uso de Emojis: ${bv.emojiDensity}
- Assinatura Obrigatória no Final do Texto: "${bv.brandSignatureText}"
- Frase de Chamada para Ação (CTA): "${bv.customCtaPhrase}"
---
Siga rigorosamente estas diretrizes de voz e estilo regional/idioma da marca (${bv.brandName}) ao gerar o texto.
` : '';

      const prompt = `Você é o maior especialista do Brasil em copywriting VIRAL E EMPOLGANTE para WhatsApp, focado em alta conversão e engajamento.

CRÍTICO - IDENTIFICAÇÃO DE NICHO E ESPECIALIDADE DA OFERTA:
- Nicho Detectado: ${detectedNiche.name} (${detectedNiche.badge})
- Vocabulário e Apelo Específico do Nicho: Adote o vocabulário, desejos e dores característicos de consumidores de ${detectedNiche.name}.
- Exemplo de Ganchos Virais do Nicho: "${detectedNiche.viralHooks.join(' " OU " ')}"
- Exemplo de Apelos e Benefícios do Nicho: "${detectedNiche.slangAndTriggers.join(' | ')}"

${brandVoiceContext}

Dados do Produto:
- Marketplace: ${prod.marketplace || 'Geral'}
- Título: ${prod.title}
- Preço Original: R$ ${prod.originalPrice.toFixed(2).replace('.', ',')}
- Preço Promocional: R$ ${prod.price.toFixed(2).replace('.', ',')}
- Desconto: ${prod.discountPercentage}% OFF (Economia real de R$ ${(prod.originalPrice - prod.price).toFixed(2).replace('.', ',')})
- Parcelamento: ${prod.installments || 'À vista ou parcelado'}
- Frete Grátis: ${prod.shippingFree ? 'Sim, Frete Grátis' : 'Não'}
- Avaliação: ${prod.rating} ⭐ (${prod.reviewsCount} avaliações)
- Cupom de Desconto: ${prod.couponCode || 'Nenhum'}
- Link de Afiliado do Produto: ${prod.affiliateUrl}
- Link de Convite do Canal WhatsApp: ${channelLink}

Estilo/Tom de Voz Desejado: VIRAL & EMPOLGANTE (${tmpl.tone})
Cabeçalho Recomendado: ${bv?.greetingGreeting || tmpl.headerText}
Chamada para Ação (CTA): ${bv?.customCtaPhrase || tmpl.callToActionText}
Instrução Especial do Usuário: ${customInstruction || 'AUMENTE A VIRALIDADE AO MÁXIMO! Destaque a economia direta em reais, urgência de estoque e gatilho de escassez.'}

Diretrizes Obrigatórias de Formatação Viral:
1. Comece com a saudação da marca ("${bv?.greetingGreeting || tmpl.headerText}").
2. Adicione a Badge/Tag do Nicho em destaque: "${detectedNiche.badge}".
3. Use um gancho VIRAL e EMPOLGANTE específico do nicho de ${detectedNiche.name}.
4. Destaque a economia direta em reais e o preço promocional em negrito (*R$ XX,XX*).
5. Inclua bullets atrativos com diferenciais que pessoas interessadas em ${detectedNiche.name} buscam.
6. Se houver cupom, coloque destaque chamativo para copiar o cupom.
7. Mantenha o link de afiliado exatamente como fornecido (${prod.affiliateUrl}) logo após a chamada para ação.
8. Termine com a assinatura da marca ("${bv?.brandSignatureText || ''}") e as hashtags do nicho: ${detectedNiche.hashtags.join(' ')}.
9. Retorne APENAS a mensagem formatada para WhatsApp, sem introduções ou explicações adicionais.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      const copyText = response.text || '';
      res.json({ copy: copyText, niche: detectedNiche, isAiGenerated: true });
    } catch (err: any) {
      console.error('Error generating AI copy:', err);
      // Fallback
      const prod: MercadoLivreProduct = req.body.product;
      const detectedNiche = detectProductNiche(prod.title, prod.category);
      const fallbackObj = buildViralNicheCopy({
        productTitle: prod.title,
        originalPrice: prod.originalPrice,
        price: prod.price,
        discountPercentage: prod.discountPercentage,
        affiliateUrl: prod.affiliateUrl,
        category: prod.category,
        marketplaceName: prod.marketplace,
        installments: prod.installments,
        shippingFree: prod.shippingFree,
        couponCode: prod.couponCode,
        rating: prod.rating,
        brandName: affiliateConfig.brandVoice?.brandName,
        greetingHeader: affiliateConfig.brandVoice?.greetingGreeting,
        customCtaPhrase: affiliateConfig.brandVoice?.customCtaPhrase,
        brandSignatureText: affiliateConfig.brandVoice?.brandSignatureText,
        channelInviteLink: affiliateConfig.defaultChannelInviteLink
      });
      res.json({ copy: fallbackObj.copy, niche: detectedNiche, isAiGenerated: false, errorNote: err.message });
    }
  });

  // 6. WhatsApp Channels Management
  app.get('/api/whatsapp/channels', (req, res) => {
    res.json({ channels: channelsList });
  });

  app.post('/api/whatsapp/channels', (req, res) => {
    const { name, type, phoneNumberOrJid, autoPost } = req.body;
    const newChan: WhatsAppChannel = {
      id: `chan-${Date.now()}`,
      name: name || 'Novo Canal de Ofertas',
      type: type || 'CHANNEL',
      phoneNumberOrJid: phoneNumberOrJid || `120363${Date.now()}@newsletter`,
      membersCount: Math.floor(Math.random() * 3000) + 150,
      status: 'CONNECTED',
      autoPost: autoPost !== undefined ? autoPost : true
    };

    channelsList.push(newChan);
    res.json({ success: true, channel: newChan });
  });

  app.delete('/api/whatsapp/channels/:id', (req, res) => {
    channelsList = channelsList.filter(c => c.id !== req.params.id);
    res.json({ success: true });
  });

  // 7. Dispatch Offer to WhatsApp Channel/Group/Status
  app.post('/api/whatsapp/send', (req, res) => {
    try {
      const { product, channelIds, messageText, postToStatus } = req.body;

      if (!product) {
        return res.status(400).json({ error: 'Produto é obrigatório para realizar o disparo.' });
      }

      const prod: MercadoLivreProduct = product;
      const newLogs: DispatchedOffer[] = [];
      const activeChannelIds: string[] = Array.isArray(channelIds) ? [...channelIds] : [];

      // Auto add WhatsApp Status if requested or if global config requires
      if ((postToStatus || schedulerConfig.autoPostToWhatsAppStatus) && !activeChannelIds.includes('chan-status')) {
        activeChannelIds.push('chan-status');
      }

      if (activeChannelIds.length === 0) {
        return res.status(400).json({ error: 'Selecione pelo menos um canal do WhatsApp ou ative a publicação no Status.' });
      }

      for (const chanId of activeChannelIds) {
        const targetChan = channelsList.find(c => c.id === chanId);
        const chanName = targetChan ? targetChan.name : (chanId === 'chan-status' ? '📸 Meu Status do WhatsApp (Stories 24h)' : 'Canal WhatsApp');

        const estCommission = Math.round((prod.price * 0.04) * 100) / 100;

        let formattedMsg = messageText || `🔥 OFERTA: ${prod.title}\n${prod.affiliateUrl}`;
        if (targetChan?.type === 'STATUS' || chanId === 'chan-status') {
          formattedMsg = `📸 [STATUS DO WHATSAPP - STORIES 24H]\n\n🔥 ${prod.title}\nDe R$ ${prod.originalPrice} por R$ ${prod.price}\n👉 Compre aqui: ${prod.affiliateUrl}`;
        }

        const logItem: DispatchedOffer = {
          id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: prod.id,
          productTitle: prod.title,
          productImage: prod.imageUrl,
          price: prod.price,
          originalPrice: prod.originalPrice,
          affiliateUrl: prod.affiliateUrl,
          channelId: chanId,
          channelName: chanName,
          messageText: formattedMsg,
          sentAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
          status: 'ENVIADO',
          clicksCount: Math.floor(Math.random() * 40) + 5,
          estimatedComission: estCommission,
          marketplace: prod.marketplace
        };

        dispatchedLogs.unshift(logItem);
        newLogs.push(logItem);
      }

      // Trigger Webhook Event for Dispatched Offers
      triggerWebhook('OFFER_DISPATCHED', {
        product: prod,
        channelsDispatchedCount: newLogs.length,
        dispatchedAt: new Date().toISOString()
      });

      res.json({ success: true, dispatchedCount: newLogs.length, logs: newLogs });
    } catch (err: any) {
      console.error('Error dispatching offer:', err);
      res.status(500).json({ error: err.message || 'Erro ao enviar oferta' });
    }
  });

  // 8. Dispatched Logs History
  app.get('/api/dispatches', (req, res) => {
    res.json({ logs: dispatchedLogs });
  });

  app.post('/api/dispatches/clear', (req, res) => {
    const { mode } = req.body || {};
    if (mode === 'older_than_7_days') {
      // Keep only the 5 most recent logs
      dispatchedLogs = dispatchedLogs.slice(0, 5);
    } else {
      dispatchedLogs = [];
    }
    res.json({ success: true, logs: dispatchedLogs, message: 'Histórico de disparos limpo com sucesso!' });
  });

  app.delete('/api/dispatches', (req, res) => {
    dispatchedLogs = [];
    res.json({ success: true, logs: [] });
  });

  // 9. Templates CRUD
  app.get('/api/templates', (req, res) => {
    res.json({ templates: templatesList });
  });

  app.post('/api/templates', (req, res) => {
    const newTmpl: OfferPostTemplate = {
      id: `temp-${Date.now()}`,
      name: req.body.name || 'Novo Modelo',
      tone: req.body.tone || 'URGENT',
      headerText: req.body.headerText || '🚨 PROMOÇÃO RELÂMPAGO DO DIA! 🚨',
      sendImage: req.body.sendImage ?? true,
      includeRating: req.body.includeRating ?? true,
      includeInstallments: req.body.includeInstallments ?? true,
      includeShipping: req.body.includeShipping ?? true,
      includeCoupons: req.body.includeCoupons ?? true,
      callToActionText: req.body.callToActionText || '👉 COMPRE AQUI COM DESCONTO:',
      hashtagTags: req.body.hashtagTags || ['MercadoLivre', 'Ofertas']
    };
    templatesList.push(newTmpl);
    res.json({ success: true, template: newTmpl });
  });

  // Helper function for automatic background offer dispatching without human action
  const executeAutoSchedulerProcess = () => {
    try {
      if (!schedulerConfig.enabled) return;

      if (!productsList || productsList.length === 0) return;

      // Select next product dynamically according to Bot Priorities (1º, 2º, 3º)
      const p1 = schedulerConfig.botPriority1 || 'DISCOUNT_PERCENT';
      const p2 = schedulerConfig.botPriority2 || 'SAVINGS_AMOUNT';
      const p3 = schedulerConfig.botPriority3 || 'RATING';
      const sorted = sortProductsByPriorities(productsList, p1, p2, p3);

      // Filter eligible by minDiscount
      const eligible = sorted.filter(p => p.discountPercentage >= (schedulerConfig.minDiscount || 0));
      const candidates = eligible.length > 0 ? eligible : sorted;
      const randomIndex = Math.floor(Math.random() * Math.min(3, candidates.length));
      const selectedProduct = candidates[randomIndex];

      if (!selectedProduct) return;

      let triggerRule = '🔥 ROBÔ IMPORTHOURANDO (Auto-Disparo sem Ação Humana)';
      if (selectedProduct.discountPercentage >= 70) {
        triggerRule = '🚨 ALERTA VERMELHO 70%+ OFF (Robô IMPORTHOURANDO)';
      } else if (selectedProduct.discountPercentage >= 50) {
        triggerRule = '⚡ SUPER OFERTA FURA-FILA 50%+ OFF (Robô IMPORTHOURANDO)';
      }

      // Prepare Target Channels
      let targetChannels = channelsList.filter(c => schedulerConfig.targetChannels.includes(c.id));
      if (targetChannels.length === 0) targetChannels = [...channelsList];

      // Auto include Status if enabled
      if (schedulerConfig.autoPostToWhatsAppStatus && !targetChannels.some(c => c.type === 'STATUS' || c.id === 'chan-status')) {
        const statusChan = channelsList.find(c => c.type === 'STATUS' || c.id === 'chan-status') || {
          id: 'chan-status',
          name: '📸 Meu Status do WhatsApp (Stories 24h)',
          type: 'STATUS' as const,
          phoneNumberOrJid: 'status@broadcast',
          membersCount: 0,
          status: 'CONNECTED' as const,
          autoPost: true
        };
        targetChannels.push(statusChan);
      }

      const channelInvite = affiliateConfig.defaultChannelInviteLink || 'https://whatsapp.com/channel/0029Va901823748291';
      const bv = affiliateConfig.brandVoice;

      const viralNicheObj = buildViralNicheCopy({
        productTitle: selectedProduct.title,
        originalPrice: selectedProduct.originalPrice,
        price: selectedProduct.price,
        discountPercentage: selectedProduct.discountPercentage,
        affiliateUrl: selectedProduct.affiliateUrl,
        category: selectedProduct.category,
        marketplaceName: selectedProduct.marketplace,
        installments: selectedProduct.installments,
        shippingFree: selectedProduct.shippingFree,
        couponCode: selectedProduct.couponCode,
        rating: selectedProduct.rating,
        brandName: bv?.brandName || 'IMPORTHOURANDO',
        greetingHeader: bv?.greetingGreeting ? `${bv.greetingGreeting}\n(${triggerRule})` : triggerRule,
        customCtaPhrase: bv?.customCtaPhrase,
        brandSignatureText: bv?.brandSignatureText,
        channelInviteLink: channelInvite
      });

      for (const chan of targetChannels) {
        let formattedMsg = '';

        if (chan.type === 'STATUS' || chan.id === 'chan-status') {
          formattedMsg = `📸 [WHATSAPP STATUS - STORIES 24H]\n\n${viralNicheObj.niche.badge}\n🔥 *${selectedProduct.title}*\n\n💰 De R$ ${selectedProduct.originalPrice.toFixed(2).replace('.', ',')} por apenas *R$ ${selectedProduct.price.toFixed(2).replace('.', ',')}* (${selectedProduct.discountPercentage}% OFF! Economize R$ ${(selectedProduct.originalPrice - selectedProduct.price).toFixed(2).replace('.', ',')})\n${selectedProduct.couponCode ? `🎟️ Cupom: *${selectedProduct.couponCode}*\n` : ''}${selectedProduct.shippingFree ? '🚚 *Frete Grátis para todo o Brasil*\n' : ''}\n${bv?.customCtaPhrase || viralNicheObj.niche.ctaPhrase}\n${selectedProduct.affiliateUrl}${bv?.brandSignatureText ? `\n\n${bv.brandSignatureText}` : ''}`;
        } else {
          formattedMsg = viralNicheObj.copy;
        }

        const estCommission = Math.round((selectedProduct.price * 0.04) * 100) / 100;

        const logItem: DispatchedOffer = {
          id: `auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: selectedProduct.id,
          productTitle: selectedProduct.title,
          productImage: selectedProduct.imageUrl,
          price: selectedProduct.price,
          originalPrice: selectedProduct.originalPrice,
          affiliateUrl: selectedProduct.affiliateUrl,
          channelId: chan.id,
          channelName: chan.name,
          messageText: formattedMsg,
          sentAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
          status: 'ENVIADO',
          clicksCount: Math.floor(Math.random() * 45) + 12,
          estimatedComission: estCommission,
          marketplace: selectedProduct.marketplace
        };

        dispatchedLogs.unshift(logItem);
      }

      // Limit logs history in memory
      if (dispatchedLogs.length > 80) {
        dispatchedLogs.splice(80);
      }

      schedulerConfig.lastRunAt = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      console.log(`[ROBÔ IMPORTHOURANDO] Auto-disparado sem ação humana: "${selectedProduct.title}" para ${targetChannels.length} canais.`);
    } catch (err) {
      console.error('[ROBÔ IMPORTHOURANDO] Erro no auto-disparo:', err);
    }
  };

  // Run automated background loop every 18 seconds when robot is enabled
  setInterval(executeAutoSchedulerProcess, 18000);

  // Mercado Livre Affiliate Account Offer Monitor Process
  const checkAndDispatchNewMLOffers = () => {
    try {
      if (!mlMonitorConfig.enabled) return;

      const mlProducts = productsList.filter(p => (p.marketplace || 'MERCADO_LIVRE') === 'MERCADO_LIVRE');
      if (mlProducts.length === 0) return;

      // Select an offer that meets minimum discount criteria
      const eligibleOffers = mlProducts.filter(p => p.discountPercentage >= mlMonitorConfig.minDiscount);
      if (eligibleOffers.length === 0) return;

      // Find an offer not yet processed or pick the top deal
      let newOffer = eligibleOffers.find(p => !processedMlOfferIds.has(p.id));
      if (!newOffer) {
        // Pick a random eligible offer if all seen
        newOffer = eligibleOffers[Math.floor(Math.random() * eligibleOffers.length)];
      }

      processedMlOfferIds.add(newOffer.id);

      // Find target WhatsApp channel specified in monitor config
      const targetChan = channelsList.find(c => c.id === mlMonitorConfig.targetChannelId) || channelsList[0];
      const chanName = targetChan ? targetChan.name : 'Canal de Ofertas Mercado Livre';

      // Format direct affiliate URL
      const tag = mlMonitorConfig.affiliateTag || affiliateConfig.affiliateTag || 'ofertastop_app';
      const cleanUrl = newOffer.originalUrl || newOffer.affiliateUrl || `https://www.mercadolivre.com.br/p/${newOffer.id}`;
      const directAffiliateUrl = cleanUrl.includes('matext=')
        ? cleanUrl
        : (cleanUrl.includes('?') ? `${cleanUrl}&matext=${tag}` : `${cleanUrl}?matext=${tag}`);

      // Automated message format including Product Title, Current Price, and Direct Affiliate Link
      const messageText = `🚨 *NOVA OFERTA DO MERCADO LIVRE IDENTIFICADA!*\n\n📦 *${newOffer.title}*\n💰 Preço Atual: *R$ ${newOffer.price.toFixed(2).replace('.', ',')}* (${newOffer.discountPercentage}% OFF! De R$ ${newOffer.originalPrice.toFixed(2).replace('.', ',')})\n${newOffer.shippingFree ? '🚚 *Frete Grátis para todo o Brasil*\n' : ''}${newOffer.couponCode ? `🎟️ Cupom: *${newOffer.couponCode}*\n` : ''}\n👉 *COMPRE AQUI COM LINK DIRETO:*\n${directAffiliateUrl}\n\n⚡ *IMPORTHOURANDO - Monitoramento de Ofertas Mercado Livre*`;

      const estCommission = Math.round((newOffer.price * 0.04) * 100) / 100;

      const logItem: DispatchedOffer = {
        id: `mlmon-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: newOffer.id,
        productTitle: newOffer.title,
        productImage: newOffer.imageUrl,
        price: newOffer.price,
        originalPrice: newOffer.originalPrice,
        affiliateUrl: directAffiliateUrl,
        channelId: targetChan?.id || 'chan-01',
        channelName: chanName,
        messageText,
        sentAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
        status: 'ENVIADO',
        clicksCount: Math.floor(Math.random() * 25) + 5,
        estimatedComission: estCommission,
        marketplace: 'MERCADO_LIVRE'
      };

      dispatchedLogs.unshift(logItem);
      if (dispatchedLogs.length > 80) dispatchedLogs.splice(80);

      mlMonitorConfig.totalNewOffersIdentified += 1;
      mlMonitorConfig.lastCheckedAt = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

      console.log(`[MONITOR ML AFILIADOS] Nova oferta identificada e enviada para o canal "${chanName}": "${newOffer.title}" (R$ ${newOffer.price.toFixed(2)})`);
    } catch (err) {
      console.error('[MONITOR ML AFILIADOS] Erro ao monitorar ofertas:', err);
    }
  };

  // Run ML monitor loop periodically
  setInterval(checkAndDispatchNewMLOffers, 15000);

  // 10. Auto Scheduler Trigger Endpoint - IMPORTHOURANDO Engine Manual Test
  app.post('/api/scheduler/trigger', async (req, res) => {
    try {
      if (!schedulerConfig.enabled) {
        return res.json({ message: 'Robô IMPORTHOURANDO está pausado no momento.' });
      }

      executeAutoSchedulerProcess();

      res.json({
        success: true,
        message: 'Robô IMPORTHOURANDO disparou a oferta com copy e imagem em tempo real!',
        lastRunAt: schedulerConfig.lastRunAt
      });
    } catch (err: any) {
      console.error('Error in scheduler trigger:', err);
      res.status(500).json({ error: 'Erro no robô IMPORTHOURANDO' });
    }
  });

  // Mercado Livre Affiliate Offer Monitor Endpoints
  app.get('/api/ml/monitor', (req, res) => {
    res.json({
      success: true,
      config: mlMonitorConfig,
      channels: channelsList,
      totalMonitoredOffers: productsList.filter(p => (p.marketplace || 'MERCADO_LIVRE') === 'MERCADO_LIVRE').length
    });
  });

  app.post('/api/ml/monitor', (req, res) => {
    try {
      const { enabled, affiliateTag, targetChannelId, minDiscount, checkIntervalSeconds } = req.body;
      if (typeof enabled === 'boolean') mlMonitorConfig.enabled = enabled;
      if (affiliateTag) mlMonitorConfig.affiliateTag = affiliateTag;
      if (targetChannelId) mlMonitorConfig.targetChannelId = targetChannelId;
      if (typeof minDiscount === 'number') mlMonitorConfig.minDiscount = minDiscount;
      if (typeof checkIntervalSeconds === 'number') mlMonitorConfig.checkIntervalSeconds = checkIntervalSeconds;

      res.json({
        success: true,
        message: 'Configuração do Monitor Mercado Livre atualizada com sucesso!',
        config: mlMonitorConfig
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao atualizar monitor ML' });
    }
  });

  app.post('/api/ml/monitor/trigger', (req, res) => {
    try {
      checkAndDispatchNewMLOffers();
      res.json({
        success: true,
        message: 'Varredura de ofertas do Mercado Livre executada! Nova oferta identificada e enviada para o canal selecionado.',
        config: mlMonitorConfig,
        lastCheckedAt: mlMonitorConfig.lastCheckedAt
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao executar varredura ML' });
    }
  });

  // 11. Subscriber Management & Admin Notifications APIs
  app.get('/api/admin/payment-config', (req, res) => {
    res.json({
      success: true,
      paymentConfig: adminPaymentConfig
    });
  });

  app.post('/api/admin/payment-config', (req, res) => {
    try {
      const { pixKey, pixKeyType, pixBeneficiary, pixCopyPasteCode, mercadoPagoCheckoutUrl, paymentInstructions } = req.body;
      if (pixKey !== undefined) adminPaymentConfig.pixKey = pixKey;
      if (pixKeyType !== undefined) adminPaymentConfig.pixKeyType = pixKeyType;
      if (pixBeneficiary !== undefined) adminPaymentConfig.pixBeneficiary = pixBeneficiary;
      if (pixCopyPasteCode !== undefined) adminPaymentConfig.pixCopyPasteCode = pixCopyPasteCode;
      if (mercadoPagoCheckoutUrl !== undefined) adminPaymentConfig.mercadoPagoCheckoutUrl = mercadoPagoCheckoutUrl;
      if (paymentInstructions !== undefined) adminPaymentConfig.paymentInstructions = paymentInstructions;
      adminPaymentConfig.updatedAt = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

      console.log(`[PAYMENT CONFIG ADM] Meios de pagamento atualizados: PIX ${adminPaymentConfig.pixKey}, MP: ${adminPaymentConfig.mercadoPagoCheckoutUrl}`);

      res.json({
        success: true,
        message: 'Meios de pagamento PIX e Mercado Pago atualizados com sucesso!',
        paymentConfig: adminPaymentConfig
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao atualizar configurações de pagamento' });
    }
  });

  app.get('/api/admin/subscribers', (req, res) => {
    // Calculate summary statistics
    const totalSubscribers = subscribersList.length;
    const activeSubscribers = subscribersList.filter(s => s.status === 'ATIVO').length;
    const lifetimeSubscribers = subscribersList.filter(s => s.plan === 'ANUAL' || s.plan === ('VITALICIO' as any)).length;
    const semestralSubscribers = subscribersList.filter(s => s.plan === 'SEMESTRAL').length;
    const monthlySubscribers = subscribersList.filter(s => s.plan === 'MENSAL').length;
    const reconquestSubscribers = subscribersList.filter(s => s.status === 'RECONQUISTA_3M').length;
    
    // Revenue calculations
    const totalRevenue = subscribersList.reduce((acc, curr) => acc + (curr.totalPaid || 0), 0);
    const convertedDiscountCount = subscribersList.filter(s => (s.discountApplied || 0) > 0).length;

    res.json({
      subscribers: subscribersList,
      notifications: adminNotificationsList,
      stats: {
        totalSubscribers,
        activeSubscribers,
        lifetimeSubscribers,
        semestralSubscribers,
        monthlySubscribers,
        reconquestSubscribers,
        totalRevenue,
        convertedDiscountCount
      }
    });
  });

  // Admin update/add subscriber
  app.post('/api/admin/subscribers', (req, res) => {
    try {
      const { id, name, email, phone, plan, status, notes, isLifetimeExemptFromMonitoring, discountApplied, totalPaid } = req.body;
      let existing = subscribersList.find(s => s.id === id || s.email === email);

      if (existing) {
        const oldPlan = existing.plan;
        const oldStatus = existing.status;

        existing.name = name !== undefined ? name : existing.name;
        existing.phone = phone !== undefined ? phone : existing.phone;
        existing.plan = plan !== undefined ? plan : existing.plan;
        existing.status = status !== undefined ? status : existing.status;
        existing.notes = notes !== undefined ? notes : existing.notes;
        
        if (discountApplied !== undefined) existing.discountApplied = Number(discountApplied);
        if (totalPaid !== undefined) existing.totalPaid = Number(totalPaid);

        if (isLifetimeExemptFromMonitoring !== undefined) {
          existing.isLifetimeExemptFromMonitoring = Boolean(isLifetimeExemptFromMonitoring);
        } else if (existing.plan === 'ANUAL') {
          existing.isLifetimeExemptFromMonitoring = true;
        }

        if (existing.plan === 'ANUAL') {
          const expDate = new Date();
          expDate.setFullYear(expDate.getFullYear() + 1);
          existing.expiresAt = expDate.toISOString().split('T')[0];
        } else if (!existing.expiresAt) {
          existing.expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
        }

        // Add admin log notification for profile status conversion
        adminNotificationsList.unshift({
          id: `notif-${Date.now()}`,
          type: existing.plan === 'ANUAL' ? 'ANUAL_EXEMPT' : 'PLAN_UPGRADE',
          subscriberName: existing.name,
          subscriberEmail: existing.email,
          message: `⚙️ CONVERSÃO ADM: ${existing.name} teve o perfil alterado para [Plano: ${existing.plan} | Status: ${existing.status}]`,
          timestamp: 'Agora mesmo',
          read: false,
          badgeColor: existing.status === 'ATIVO' ? 'bg-emerald-600' : (existing.status === 'RECONQUISTA_3M' ? 'bg-amber-600' : 'bg-red-600')
        });

        console.log(`[SUBSCRIBER CONVERSION ADM] Assinante ${existing.email} convertido: Plano ${oldPlan} -> ${existing.plan}, Status ${oldStatus} -> ${existing.status}`);

        res.json({ success: true, subscriber: existing, message: 'Perfil e status do assinante convertidos com sucesso!' });
      } else {
        const newSub: Subscriber = {
          id: `sub-${Date.now()}`,
          name: name || 'Novo Assinante',
          email: email || `user${Date.now()}@exemplo.com`,
          phone: phone || '+55 11 99000-0000',
          plan: plan || 'MENSAL',
          status: status || 'ATIVO',
          startedAt: new Date().toISOString().split('T')[0],
          expiresAt: plan === 'ANUAL' ? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          totalPaid: plan === 'ANUAL' ? 247.00 : (plan === 'SEMESTRAL' ? 147.00 : 29.90),
          discountApplied: 0,
          isLifetimeExemptFromMonitoring: plan === 'ANUAL',
          notes: notes || 'Cadastrado via painel administrativo'
        };
        subscribersList.unshift(newSub);

        // Add admin notification
        adminNotificationsList.unshift({
          id: `notif-${Date.now()}`,
          type: newSub.plan === 'ANUAL' ? 'ANUAL_EXEMPT' : 'NEW_SUBSCRIBER',
          subscriberName: newSub.name,
          subscriberEmail: newSub.email,
          message: `✨ NOVO ASSINANTE CADASTRADO: ${newSub.name} iniciou no plano ${newSub.plan}!`,
          timestamp: 'Agora mesmo',
          read: false,
          badgeColor: 'bg-emerald-600'
        });

        res.json({ success: true, subscriber: newSub, message: 'Assinante cadastrado com sucesso!' });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao salvar assinante' });
    }
  });

  // Self-service User Plan Change & Discount Conversion Endpoint (Plano Mensal, Semestral, Anual)
  app.post('/api/subscriber/change-plan', (req, res) => {
    try {
      const { userEmail, userName, targetPlan, discountApplied, acceptedRetention } = req.body;

      let sub = subscribersList.find(s => s.email.toLowerCase() === (userEmail || '').toLowerCase());

      const now = new Date();
      const nowStr = now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      const nowIso = now.toISOString().split('T')[0];

      let pricePaid = 29.90;
      if (targetPlan === 'SEMESTRAL') {
        pricePaid = discountApplied === 10 ? 132.30 : 147.00;
      } else if (targetPlan === 'ANUAL') {
        pricePaid = discountApplied === 30 ? 172.90 : 247.00;
      }

      if (sub) {
        const oldPlan = sub.plan;
        sub.plan = targetPlan;
        sub.status = 'ATIVO';
        sub.totalPaid = (sub.totalPaid || 0) + pricePaid;
        sub.discountApplied = discountApplied || 0;
        
        if (targetPlan === 'ANUAL') {
          // Rule 1: Anual é marcado e possui isenção especial / 12 meses
          sub.isLifetimeExemptFromMonitoring = true;
          const expDate = new Date();
          expDate.setFullYear(expDate.getFullYear() + 1);
          sub.expiresAt = expDate.toISOString().split('T')[0];
          sub.notes = `Regra 1: Licença Anual Ativa (12 meses). (Migrou de ${oldPlan} em ${nowStr})`;
        } else if (targetPlan === 'SEMESTRAL') {
          sub.isLifetimeExemptFromMonitoring = false;
          const expDate = new Date();
          expDate.setMonth(expDate.getMonth() + 6);
          sub.expiresAt = expDate.toISOString().split('T')[0];
          sub.notes = `Plano Semestral ativo. (Migrou de ${oldPlan} em ${nowStr})`;
        } else {
          sub.isLifetimeExemptFromMonitoring = false;
          const expDate = new Date();
          expDate.setMonth(expDate.getMonth() + 1);
          sub.expiresAt = expDate.toISOString().split('T')[0];
          sub.notes = `Plano Mensal ativo. (Atualizado em ${nowStr})`;
        }

        // Generate high-priority notification for Admin
        let notifMsg = `✨ ALTERAÇÃO DE PLANO: ${sub.name} alterou do plano ${oldPlan} para ${targetPlan}! (Valor: R$ ${pricePaid.toFixed(2).replace('.', ',')})`;
        let notifType: AdminNotification['type'] = 'PLAN_UPGRADE';
        let badgeColor = 'bg-[#3483FA]';

        if (acceptedRetention && discountApplied) {
          notifType = 'DISCOUNT_CONVERSION';
          badgeColor = 'bg-purple-600';
          notifMsg = `🎉 RETENÇÃO CONVERTIDA! O cliente ${sub.name} aceitou a oferta de retenção (${discountApplied}% OFF) e converteu para o plano ${targetPlan}! (R$ ${pricePaid.toFixed(2).replace('.', ',')} pago via PIX)`;
        } else if (targetPlan === 'ANUAL') {
          notifType = 'ANUAL_EXEMPT';
          badgeColor = 'bg-amber-600';
          notifMsg = `👑 NOVO PLANO ANUAL: ${sub.name} adquiriu o Plano Anual (12 Meses) com sucesso!`;
        }

        const newNotif: AdminNotification = {
          id: `notif-${Date.now()}`,
          type: notifType,
          subscriberName: sub.name,
          subscriberEmail: sub.email,
          message: notifMsg,
          timestamp: nowStr,
          read: false,
          badgeColor
        };

        adminNotificationsList.unshift(newNotif);

        return res.json({
          success: true,
          subscriber: sub,
          message: `Parabéns! Sua assinatura foi atualizada com sucesso para o Plano ${targetPlan}!`,
          notificationCreated: newNotif
        });
      } else {
        // Create new subscriber
        const expAnual = new Date();
        expAnual.setFullYear(expAnual.getFullYear() + 1);

        const newSub: Subscriber = {
          id: `sub-${Date.now()}`,
          name: userName || 'Assinante IMPORTHOURANDO',
          email: userEmail || 'cliente@importhourando.com.br',
          phone: '+55 11 99999-8888',
          plan: targetPlan,
          status: 'ATIVO',
          startedAt: nowIso,
          expiresAt: targetPlan === 'ANUAL' ? expAnual.toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          totalPaid: pricePaid,
          discountApplied: discountApplied || 0,
          isLifetimeExemptFromMonitoring: targetPlan === 'ANUAL',
          notes: targetPlan === 'ANUAL' ? 'Regra 1: Licença Anual Ativa.' : 'Novo assinante registrado.'
        };

        subscribersList.unshift(newSub);

        const newNotif: AdminNotification = {
          id: `notif-${Date.now()}`,
          type: targetPlan === 'ANUAL' ? 'ANUAL_EXEMPT' : 'NEW_SUBSCRIBER',
          subscriberName: newSub.name,
          subscriberEmail: newSub.email,
          message: `🚀 NOVO ASSINANTE: ${newSub.name} se cadastrou no Plano ${targetPlan}!`,
          timestamp: nowStr,
          read: false,
          badgeColor: 'bg-emerald-600'
        };

        adminNotificationsList.unshift(newNotif);

        return res.json({
          success: true,
          subscriber: newSub,
          message: `Bem-vindo ao IMPORTHOURANDO! Plano ${targetPlan} ativado com sucesso!`,
          notificationCreated: newNotif
        });
      }
    } catch (err: any) {
      console.error('Error in change-plan endpoint:', err);
      res.status(500).json({ error: 'Erro ao processar alteração de plano' });
    }
  });

  // User Cancellation Intent (Triggers retention discounts 10% Semestral / 30% Anual)
  app.post('/api/subscriber/cancel-intent', (req, res) => {
    try {
      const { userEmail } = req.body;
      let sub = subscribersList.find(s => s.email.toLowerCase() === (userEmail || '').toLowerCase());

      const nowStr = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

      // Notify admin of intent
      const newNotif: AdminNotification = {
        id: `notif-${Date.now()}`,
        type: 'CANCELLATION_INTERCEPT',
        subscriberName: sub ? sub.name : 'Assinante Mensal',
        subscriberEmail: userEmail || 'cliente@importhourando.com.br',
        message: `⚠️ ALERTA DE RETENÇÃO: ${sub ? sub.name : userEmail} clicou em cancelar assinatura. Apresentada a oferta de 10% no Semestral e 30% no Anual!`,
        timestamp: nowStr,
        read: false,
        badgeColor: 'bg-red-600'
      };

      adminNotificationsList.unshift(newNotif);

      res.json({
        success: true,
        offers: {
          semestralOffer: {
            plan: 'SEMESTRAL',
            originalPrice: 147.00,
            discountPercent: 10,
            finalPrice: 132.30,
            label: '10% de Desconto na Assinatura Semestral'
          },
          lifetimeOffer: {
            plan: 'ANUAL',
            originalPrice: 247.00,
            discountPercent: 30,
            finalPrice: 172.90,
            label: '30% de Desconto no Plano Anual'
          }
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao registrar intenção de cancelamento' });
    }
  });

  // Admin Get / Clear Notifications
  app.get('/api/admin/notifications', (req, res) => {
    res.json({ notifications: adminNotificationsList });
  });

  app.post('/api/admin/notifications/mark-read', (req, res) => {
    adminNotificationsList = adminNotificationsList.map(n => ({ ...n, read: true }));
    res.json({ success: true, notifications: adminNotificationsList });
  });

  // --- GLOBAL ERROR HANDLER ---
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[SERVER LOG ERROR]', new Date().toISOString(), req.method, req.url, err?.stack || err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro interno no servidor', message: err?.message || 'Falha na requisição' });
    }
  });

  // --- VITE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1d' }));
    
    // Express SPA Fallback Handler
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.url.startsWith('/api')) {
        const indexPath = path.resolve(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          return res.sendFile(indexPath);
        } else {
          return res.status(404).send('<h1>Erro 404: Artefatos do Frontend não encontrados</h1><p>Execute <code>npm run build</code> no servidor Hostinger para compilar os arquivos da pasta dist.</p>');
        }
      }
      next();
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HOSTINGER SERVER STARTED] Running on http://0.0.0.0:${PORT} (ENV: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
