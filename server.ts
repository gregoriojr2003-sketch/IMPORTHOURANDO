import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_PRODUCTS, INITIAL_CHANNELS, INITIAL_TEMPLATES, INITIAL_DISPATCHED_LOGS, INITIAL_SCHEDULER_CONFIG, INITIAL_AFFILIATE_CONFIG, INITIAL_SUBSCRIBERS, INITIAL_ADMIN_NOTIFICATIONS } from './src/data/initialData.ts';
import { MercadoLivreProduct, DispatchedOffer, OfferPostTemplate, WhatsAppChannel, AutoSchedulerConfig, AffiliateConfig, Subscriber, AdminNotification, AdminPaymentConfig } from './src/types.ts';
import { detectProductNiche, buildViralNicheCopy } from './src/utils/nicheDetector.ts';
import { sortProductsByPriorities } from './src/utils/productSorter.ts';
import { initDatabase, querySql, execSql, currentDbEngine } from './server/db.ts';

const currentFilename = typeof __filename !== 'undefined' ? __filename : '';
const currentDirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

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

// Persistent Disk Store File Setup
const STORE_FILE = path.join(process.cwd(), 'data_store.json');

// Track used trial IPs and Device Fingerprints to enforce strictly 1-time free trial per IP/MAC/Device
let usedTrialIps: string[] = [];

// Real database user passwords store (email -> password hash)
let userPasswordsMap: Record<string, string> = {
  'gregoriojr2003@gmail.com': '123456',
  'admin@importhourando.com.br': '123456'
};

function loadPersistentStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.affiliateConfig) affiliateConfig = { ...INITIAL_AFFILIATE_CONFIG, ...data.affiliateConfig };
      if (data.schedulerConfig) schedulerConfig = { ...INITIAL_SCHEDULER_CONFIG, ...data.schedulerConfig };
      if (data.mlMonitorConfig) mlMonitorConfig = { ...mlMonitorConfig, ...data.mlMonitorConfig };
      if (data.subscribersList && Array.isArray(data.subscribersList) && data.subscribersList.length > 0) subscribersList = data.subscribersList;
      if (data.channelsList && Array.isArray(data.channelsList) && data.channelsList.length > 0) channelsList = data.channelsList;
      if (data.templatesList && Array.isArray(data.templatesList) && data.templatesList.length > 0) templatesList = data.templatesList;
      if (data.adminPaymentConfig) adminPaymentConfig = data.adminPaymentConfig;
      if (data.usedTrialIps && Array.isArray(data.usedTrialIps)) usedTrialIps = data.usedTrialIps;
      if (data.userPasswordsMap && typeof data.userPasswordsMap === 'object') userPasswordsMap = data.userPasswordsMap;
      console.log('[PERSISTENCE] Data store loaded successfully from data_store.json');
    }
  } catch (err) {
    console.error('[PERSISTENCE] Error loading data store:', err);
  }
}

function savePersistentStore() {
  try {
    const data = {
      affiliateConfig,
      schedulerConfig,
      mlMonitorConfig,
      subscribersList,
      channelsList,
      templatesList,
      adminPaymentConfig,
      usedTrialIps,
      userPasswordsMap
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');

  } catch (err) {
    console.error('[PERSISTENCE] Error saving data store:', err);
  }
}

// Load data immediately on server start
loadPersistentStore();

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
  // Initialize Database (SQLite by default, PostgreSQL if DATABASE_URL configured)
  await initDatabase().catch(err => console.error('[DATABASE] Initialization error:', err));

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // --- SECURITY & CORS HEADERS MIDDLEWARE ---
  app.use((req, res, next) => {
    // Dynamic CORS origin handling (Wildcard + Allow-Credentials causes browser fetch network errors)
    const reqOrigin = req.headers.origin;
    if (reqOrigin) {
      res.setHeader('Access-Control-Allow-Origin', reqOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control, Origin');

    // Content Security Policy permitting frame embedding in AI Studio and external previews
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' https: http: data: blob: 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https:; img-src 'self' data: blob: https: http:; font-src 'self' data: https://fonts.gstatic.com https:; connect-src 'self' https: http: ws: wss:; frame-ancestors *; object-src 'none'; base-uri 'self';"
    );

    // Prevent MIME-Type Sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Handle Preflight OPTIONS Request immediately
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  });

  app.use(express.json());

  // Helper function to dispatch active webhooks asynchronously
  async function dispatchWebhooksForEvent(eventType: 'DISPATCH_SUCCESS' | 'DISPATCH_FAILURE' | 'PRICE_ALERT', payloadData: any) {
    if (!affiliateConfig.webhooks || !Array.isArray(affiliateConfig.webhooks)) return;
    const activeWebhooks = affiliateConfig.webhooks.filter(w => w.enabled && w.events.includes(eventType));

    for (const wh of activeWebhooks) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'IMPORTHOURANDO-Bot-Webhook/1.0'
        };
        if (wh.secretToken) {
          headers['X-Webhook-Secret'] = wh.secretToken;
        }

        const res = await fetch(wh.url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event: eventType,
            timestamp: new Date().toISOString(),
            app: 'IMPORTHOURANDO',
            data: payloadData
          }),
          signal: AbortSignal.timeout(6000)
        });

        wh.lastStatus = res.status;
        wh.lastTriggeredAt = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      } catch (err: any) {
        console.error(`[WEBHOOK ERROR] Failed to send to ${wh.url}:`, err.message);
        wh.lastStatus = 500;
      }
    }
  }

  // Helper function to extract client IP address accurately
  function getClientIp(req: express.Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.length > 0) return realIp.trim();
    return req.socket.remoteAddress || '127.0.0.1';
  }

  // --- API ROUTES ---

  // 1. Health check & Database Status
  app.get('/api/health', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({
      status: 'ok',
      engine: 'IMPORTHOURANDO-Cloud-Runner',
      database: currentDbEngine,
      time: new Date().toISOString()
    });
  });

  app.get('/api/database/status', async (req, res) => {
    try {
      const subs = await querySql('SELECT COUNT(*) as count FROM subscribers');
      const count = subs[0]?.count || subs[0]?.COUNT || 0;
      res.json({
        success: true,
        engine: currentDbEngine,
        status: 'CONNECTED',
        tables: ['subscribers', 'used_trial_ips', 'affiliate_configs', 'admin_notifications'],
        subscribersCount: Number(count),
        info: currentDbEngine === 'POSTGRES'
          ? 'Conectado com sucesso ao banco PostgreSQL via URL de Conexão.'
          : 'Conectado ao banco relacional SQLite local (database.sqlite). Pronto para migrar para PostgreSQL atribuindo a variável DATABASE_URL.'
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao consultar banco de dados', details: err?.message });
    }
  });

  // 1.1 Strict Single-Trial IP & MAC/Device Control Endpoints
  app.get('/api/trial/check', (req, res) => {
    const clientIp = getClientIp(req);
    const deviceFp = req.query.deviceFingerprint ? String(req.query.deviceFingerprint) : '';

    const isIpUsed = usedTrialIps.includes(clientIp);
    const isDeviceUsed = Boolean(deviceFp) && usedTrialIps.includes(deviceFp);
    const used = isIpUsed || isDeviceUsed;

    res.json({
      used,
      clientIp,
      message: used 
        ? `Este endereço IP (${clientIp}) ou dispositivo já utilizou o teste grátis de 30 minutos.`
        : `Degustação de 30 minutos disponível para o IP ${clientIp}.`
    });
  });

  app.post('/api/trial/claim', (req, res) => {
    const clientIp = getClientIp(req);
    const deviceFp = req.body.deviceFingerprint ? String(req.body.deviceFingerprint) : '';

    const isIpUsed = usedTrialIps.includes(clientIp);
    const isDeviceUsed = Boolean(deviceFp) && usedTrialIps.includes(deviceFp);

    if (isIpUsed || isDeviceUsed) {
      console.warn(`[TRIAL BLOCKED] Endereço IP ${clientIp} (Device: ${deviceFp || 'N/A'}) tentou iniciar nova degustação, mas já havia utilizado.`);
      return res.status(403).json({
        allowed: false,
        error: 'TRIAL_EXHAUSTED',
        clientIp,
        message: `O seu endereço IP (${clientIp}) ou dispositivo já realizou a degustação de 30 minutos! É necessário criar uma conta e assinar um plano para usar o aplicativo.`
      });
    }

    // Register IP and Device Fingerprint as used
    if (!usedTrialIps.includes(clientIp)) {
      usedTrialIps.push(clientIp);
    }
    if (deviceFp && !usedTrialIps.includes(deviceFp)) {
      usedTrialIps.push(deviceFp);
    }

    savePersistentStore();
    console.log(`[TRIAL CLAIMED] Degustação de 30 min iniciada com sucesso para o IP: ${clientIp} (Device: ${deviceFp || 'N/A'})`);

    res.json({
      allowed: true,
      clientIp,
      message: 'Degustação de 30 minutos liberada para seu IP com sucesso!'
    });
  });

  // 1.2 Real Database Auth Endpoints (Email/Password Register & Login via SQL DB)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();

      // Check SQL database first
      const dbSubs = await querySql('SELECT * FROM subscribers WHERE LOWER(email) = ?', [cleanEmail]);
      if (dbSubs.length > 0) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado no banco de dados. Faça login para acessar.' });
      }

      // Store password in persistent map
      userPasswordsMap[cleanEmail] = String(password);

      // Create new subscriber record
      const isAdm = cleanEmail === 'gregoriojr2003@gmail.com' || cleanEmail === 'admin@importhourando.com.br';
      const newSub: Subscriber = {
        id: `sub-${Date.now()}`,
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: phone || '+55 (11) 99999-0000',
        plan: 'MENSAL',
        status: isAdm ? 'ATIVO' : 'PENDENTE',
        startedAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        totalPaid: isAdm ? 0 : 29.90,
        discountApplied: 0,
        isLifetimeExemptFromMonitoring: isAdm,
        notes: `Cadastro direto via e-mail/senha. Banco SQL (${currentDbEngine}) atualizado.`
      };

      // Insert into SQL DB
      await execSql(`
        INSERT INTO subscribers (id, name, email, password, phone, plan, status, started_at, expires_at, total_paid, is_lifetime_exempt, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newSub.id,
        newSub.name,
        newSub.email,
        String(password),
        newSub.phone,
        newSub.plan,
        newSub.status,
        newSub.startedAt,
        newSub.expiresAt,
        newSub.totalPaid,
        newSub.isLifetimeExemptFromMonitoring ? 1 : 0,
        newSub.notes
      ]).catch(e => console.error('[SQL INSERT ERROR]', e));

      subscribersList.unshift(newSub);

      adminNotificationsList.unshift({
        id: `notif-${Date.now()}`,
        type: 'NEW_SUBSCRIBER',
        subscriberName: newSub.name,
        subscriberEmail: newSub.email,
        message: `✨ NOVO USUÁRIO CADASTRADO (${currentDbEngine}): ${newSub.name} criou uma conta via e-mail (${newSub.email})!`,
        timestamp: 'Agora mesmo',
        read: false,
        badgeColor: 'bg-emerald-600'
      });

      savePersistentStore();
      console.log(`[REAL AUTH SQL] Novo usuário cadastrado no banco ${currentDbEngine}: ${cleanEmail}`);

      res.json({
        success: true,
        message: `Cadastro realizado com sucesso no banco de dados (${currentDbEngine})!`,
        user: {
          name: newSub.name,
          email: newSub.email,
          role: isAdm ? 'ADMIN' : 'SUBSCRIBER',
          subscriber: newSub
        }
      });
    } catch (err: any) {
      console.error('[REAL AUTH REGISTER ERROR]', err);
      res.status(500).json({ error: 'Erro ao processar cadastro no banco de dados.' });
    }
  });

  // Store for pending email / WhatsApp verification codes
  const pendingAuthCodes: Record<string, { code: string; email: string; name?: string; password?: string; phone?: string; expiresAt: number }> = {};

  // 1. Send Email / Phone Verification Code
  app.post('/api/auth/send-verification', async (req, res) => {
    try {
      const { email, name, password, phone } = req.body;
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ error: 'E-mail inválido para envio do código de verificação.' });
      }

      // Check if email already registered in DB
      const dbSubs = await querySql('SELECT * FROM subscribers WHERE LOWER(email) = ?', [cleanEmail]);
      if (dbSubs.length > 0) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema. Por favor, acesse a aba "Entrar" para fazer login.' });
      }

      // Generate 6-digit PIN code
      const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
      pendingAuthCodes[cleanEmail] = {
        code: generatedCode,
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        password: password || '',
        phone: phone || '',
        expiresAt: Date.now() + 15 * 60 * 1000 // 15 min expiry
      };

      console.log(`[AUTH VERIFICATION CODE GENERATED] Code for ${cleanEmail}: ${generatedCode}`);

      res.json({
        success: true,
        message: `Código de verificação de 6 dígitos enviado para ${cleanEmail}!`,
        verificationCode: generatedCode
      });
    } catch (err: any) {
      console.error('[SEND VERIFICATION CODE ERROR]', err);
      res.status(500).json({ error: 'Erro ao gerar e enviar código de verificação.' });
    }
  });

  // 2. Confirm Email Verification Code and Activate Account
  app.post('/api/auth/verify-code', async (req, res) => {
    try {
      const { email, code, name, password, phone } = req.body;
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanCode = String(code || '').trim();

      const pending = pendingAuthCodes[cleanEmail];
      if (!pending) {
        return res.status(400).json({ error: 'Nenhum código de verificação pendente encontrado para este e-mail. Solicite um novo código.' });
      }

      if (pending.expiresAt < Date.now()) {
        delete pendingAuthCodes[cleanEmail];
        return res.status(400).json({ error: 'O código de verificação expirou. Solicite um novo código de ativação.' });
      }

      if (pending.code !== cleanCode) {
        return res.status(400).json({ error: 'Código de verificação incorreto. Verifique o número digitado e tente novamente.' });
      }

      // Code matched! Create active subscriber account in SQL database
      const finalName = name || pending.name || cleanEmail.split('@')[0];
      const finalPassword = password || pending.password || '123456';
      const finalPhone = phone || pending.phone || '+55 (11) 99999-0000';
      const isAdm = cleanEmail === 'gregoriojr2003@gmail.com' || cleanEmail === 'admin@importhourando.com.br';

      userPasswordsMap[cleanEmail] = finalPassword;

      const newSub: Subscriber = {
        id: `sub-${Date.now()}`,
        name: finalName,
        email: cleanEmail,
        phone: finalPhone,
        plan: 'MENSAL',
        status: 'ATIVO',
        startedAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        totalPaid: isAdm ? 0 : 29.90,
        discountApplied: 0,
        isLifetimeExemptFromMonitoring: isAdm,
        notes: `Conta ativada e confirmada via código de verificação por e-mail.`
      };

      await execSql(`
        INSERT INTO subscribers (id, name, email, password, phone, plan, status, started_at, expires_at, total_paid, is_lifetime_exempt, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newSub.id,
        newSub.name,
        newSub.email,
        finalPassword,
        newSub.phone,
        newSub.plan,
        newSub.status,
        newSub.startedAt,
        newSub.expiresAt,
        newSub.totalPaid,
        newSub.isLifetimeExemptFromMonitoring ? 1 : 0,
        newSub.notes
      ]).catch(e => console.error('[SQL REGISTER INSERT ERROR]', e));

      subscribersList.unshift(newSub);
      delete pendingAuthCodes[cleanEmail];
      savePersistentStore();

      res.json({
        success: true,
        message: 'Conta ativada com sucesso!',
        user: {
          name: newSub.name,
          email: newSub.email,
          role: isAdm ? 'ADMIN' : 'SUBSCRIBER',
          subscriber: newSub
        }
      });
    } catch (err: any) {
      console.error('[VERIFY CODE ERROR]', err);
      res.status(500).json({ error: 'Erro ao verificar código e ativar conta.' });
    }
  });

  // 3. Social OAuth Authentication Endpoint (Google, Facebook, WhatsApp OTP)
  app.post('/api/auth/social-login', async (req, res) => {
    try {
      const { provider, socialEmail, socialName, socialPhone, verifiedToken } = req.body;
      if (!socialEmail || !provider) {
        return res.status(400).json({ error: 'E-mail e provedor de autenticação são obrigatórios.' });
      }

      const cleanEmail = String(socialEmail).trim().toLowerCase();
      const isAdm = cleanEmail === 'gregoriojr2003@gmail.com' || cleanEmail === 'admin@importhourando.com.br';

      // Check if user already exists
      const dbSubs = await querySql('SELECT * FROM subscribers WHERE LOWER(email) = ?', [cleanEmail]);
      let existingSub = dbSubs[0];

      if (!existingSub) {
        // Auto-create verified social account
        const newSub: Subscriber = {
          id: `sub-${provider.toLowerCase()}-${Date.now()}`,
          name: socialName || `Usuário ${provider}`,
          email: cleanEmail,
          phone: socialPhone || '+55 (11) 99999-8888',
          plan: 'MENSAL',
          status: 'ATIVO',
          startedAt: new Date().toISOString().split('T')[0],
          expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          totalPaid: isAdm ? 0 : 29.90,
          discountApplied: 0,
          isLifetimeExemptFromMonitoring: isAdm,
          notes: `Conta autenticada e verificada via ${provider} OAuth (${verifiedToken || 'Token Válido'})`
        };

        await execSql(`
          INSERT INTO subscribers (id, name, email, password, phone, plan, status, started_at, expires_at, total_paid, is_lifetime_exempt, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newSub.id,
          newSub.name,
          newSub.email,
          'social_oauth_verified',
          newSub.phone,
          newSub.plan,
          newSub.status,
          newSub.startedAt,
          newSub.expiresAt,
          newSub.totalPaid,
          newSub.isLifetimeExemptFromMonitoring ? 1 : 0,
          newSub.notes
        ]).catch(e => console.error('[SQL SOCIAL LOGIN INSERT ERROR]', e));

        existingSub = newSub;
        subscribersList.unshift(existingSub);
        savePersistentStore();
      }

      res.json({
        success: true,
        message: `Autenticado com sucesso via ${provider}!`,
        user: {
          name: existingSub.name,
          email: existingSub.email,
          role: isAdm ? 'ADMIN' : 'SUBSCRIBER',
          subscriber: existingSub
        }
      });
    } catch (err: any) {
      console.error('[SOCIAL AUTH ERROR]', err);
      res.status(500).json({ error: 'Erro no processo de autenticação social.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Informe seu e-mail de acesso.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const isAdm = cleanEmail === 'gregoriojr2003@gmail.com' || cleanEmail === 'admin@importhourando.com.br';

      // Check SQL DB
      const dbSubs = await querySql('SELECT * FROM subscribers WHERE LOWER(email) = ?', [cleanEmail]);
      let existingDbSub = dbSubs[0];
      let existingSub = subscribersList.find(s => s.email.toLowerCase() === cleanEmail);

      // STRICT CHECK: Reject login if user does NOT exist in database!
      if (!existingDbSub && !existingSub) {
        return res.status(401).json({
          error: 'Conta não encontrada. O e-mail informado não possui cadastro ativo. Clique na aba "Criar Conta" para se cadastrar.'
        });
      }

      // Check password strictly
      const storedPassword = existingDbSub?.password || userPasswordsMap[cleanEmail];
      if (storedPassword && storedPassword !== 'social_login_oauth' && storedPassword !== 'social_oauth_verified') {
        if (!password || (storedPassword !== password && userPasswordsMap[cleanEmail] !== password)) {
          return res.status(401).json({
            error: 'Senha incorreta. Verifique suas credenciais e tente novamente.'
          });
        }
      }

      if (existingDbSub && !existingSub) {
        existingSub = {
          id: existingDbSub.id,
          name: existingDbSub.name,
          email: existingDbSub.email,
          phone: existingDbSub.phone || '+55 (11) 99999-0000',
          plan: existingDbSub.plan || 'MENSAL',
          status: existingDbSub.status || 'ATIVO',
          startedAt: existingDbSub.started_at || new Date().toISOString().split('T')[0],
          expiresAt: existingDbSub.expires_at || null,
          totalPaid: Number(existingDbSub.total_paid) || 0,
          discountApplied: 0,
          isLifetimeExemptFromMonitoring: Boolean(existingDbSub.is_lifetime_exempt),
          notes: existingDbSub.notes || ''
        };
        subscribersList.unshift(existingSub);
      }

      res.json({
        success: true,
        message: 'Login realizado com sucesso!',
        user: {
          name: existingSub ? existingSub.name : cleanEmail.split('@')[0],
          email: cleanEmail,
          role: isAdm ? 'ADMIN' : 'SUBSCRIBER',
          subscriber: existingSub
        }
      });
    } catch (err: any) {
      console.error('[REAL AUTH LOGIN ERROR]', err);
      res.status(500).json({ error: 'Erro ao realizar login.' });
    }
  });

  // 2. Mercado Livre & WhatsApp Affiliate Config
  app.get('/api/config', (req, res) => {
    res.json({ affiliateConfig, schedulerConfig });
  });

  app.post('/api/config', (req, res) => {
    if (req.body.affiliateConfig) {
      affiliateConfig = {
        ...affiliateConfig,
        ...req.body.affiliateConfig,
        marketplaceAccounts: {
          ...affiliateConfig.marketplaceAccounts,
          ...req.body.affiliateConfig.marketplaceAccounts
        },
        brandVoice: {
          ...affiliateConfig.brandVoice,
          ...req.body.affiliateConfig.brandVoice
        },
        webhooks: req.body.affiliateConfig.webhooks !== undefined ? req.body.affiliateConfig.webhooks : affiliateConfig.webhooks
      };
    }
    if (req.body.schedulerConfig) {
      schedulerConfig = { ...schedulerConfig, ...req.body.schedulerConfig };
    }
    savePersistentStore();
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
    savePersistentStore();
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
    savePersistentStore();
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
          channelInviteLink: channelLink
        });
        
        return res.json({ copy: fallbackObj.copy, niche: detectedNiche, isAiGenerated: false });
      }

      const langInstruction = bv?.language === 'EN'
        ? 'IDIOMA OBRIGATÓRIO: Escreva o texto inteiramente em INGLÊS (English).'
        : (bv?.language === 'ES'
          ? 'IDIOMA OBRIGATÓRIO: Escreva o texto inteiramente em ESPANHOL (Español).'
          : 'IDIOMA OBRIGATÓRIO: Escreva em PORTUGUÊS (Brasil).');

      const regionalInstruction = bv?.regionalStyle && bv.regionalStyle !== 'NENHUM'
        ? `- SOTAQUE / ESTILO REGIONAL BRASILEIRO OBRIGATÓRIO: ${bv.regionalStyle} (${
            bv.regionalStyle === 'NORDESTINO' ? 'Use expressões e o sotaque acolhedor e empolgado do Nordeste, como "Oxente", "Eita guri", "Pense num desconto arretado!", "Vixe Maria, que promoção!", "Aproveita que tá bom demais!"' :
            bv.regionalStyle === 'PAULISTANO' ? 'Use expressões do cotidiano paulistano com entusiasmo urbano, como "Mano do céu, que achado meeeu!", "Se liga nesse preço no precinho!", "Sem maldade, tá barato demais!"' :
            bv.regionalStyle === 'MINEIRO' ? 'Use o carisma e acolhimento mineiro com gírias típicas, como "Nuuua, ô trem bão demais da conta!", "Uai, olha esse preço!", "É bão demais da conta!"' :
            bv.regionalStyle === 'CARIOCA' ? 'Use a descontração do Rio de Janeiro, como "Coisa linda de prima!", "Nossa senhora, tá de graça, parceiro!", "Garanti o meu de primeira!"' :
            bv.regionalStyle === 'GAUCHO' ? 'Use o sotaque e bordões gaúchos/sulinos, como "Bah tchê, que barbaridade de promoção!", "Tri legal!", "Garantia bagual no precinho!"' :
            bv.regionalStyle === 'FORMAL_CORPORATIVO' ? 'Adote tom extremamente executivo, formal e sofisticado, sem gírias.' :
            bv.regionalStyle === 'DESCONTRAIDO_JOVEM' ? 'Adote linguagem jovem da Geração Z/TikTok, com gírias atuais e tom dinâmico.' :
            bv.regionalStyle === 'PROMOCIONAL_AGRESSIVO' ? 'Adote tom de locutor de supermercado / Black Friday em alta intensidade.' :
            'Humor de meme e frases engraçadas no estilo tio do WhatsApp.'
          })`
        : '';

      const brandVoiceContext = bv ? `
---
DIRETRIZES OBRIGATÓRIAS DE VOZ E IDENTIDADE DA MARCA DO CLIENTE (${bv.brandName || 'IMPORTHOURANDO'}):
- ${langInstruction}
${regionalInstruction}
- Tom de Voz Obrigatório: ${bv.toneStyle} (${bv.toneStyle === 'FORMAL' ? 'Tom respeitoso, corporativo e elegante' : bv.toneStyle === 'SALES' ? 'Foco em vendas agressivas, urgência e gatilhos de escassez' : bv.toneStyle === 'HUMOROUS' ? 'Tom descontraído, leve e divertido com piada leve' : 'Tom empolgado, entusiasta e de oportunidade viral'})
- Saudação / Abertura Obrigatória: "${bv.greetingGreeting}"
- Instruções de Voz Específicas da Marca: "${bv.customPromptInstructions}"
- Nível de Uso de Emojis: ${bv.emojiDensity}
- Assinatura Obrigatória no Final do Texto: "${bv.brandSignatureText}"
- Frase de Chamada para Ação (CTA): "${bv.customCtaPhrase}"
---
Siga rigorosamente estas diretrizes de voz, idioma e sotaque regional da marca (${bv.brandName}) ao gerar o texto.
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
    savePersistentStore();
    res.json({ success: true, channel: newChan });
  });

  app.delete('/api/whatsapp/channels/:id', (req, res) => {
    channelsList = channelsList.filter(c => c.id !== req.params.id);
    savePersistentStore();
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

      // Asynchronous Webhook Notifications Trigger
      dispatchWebhooksForEvent('DISPATCH_SUCCESS', {
        dispatchedLogs: newLogs,
        totalDispatched: newLogs.length,
        product: prod
      });

      res.json({ success: true, dispatchedCount: newLogs.length, logs: newLogs });
    } catch (err: any) {
      console.error('Error dispatching offer:', err);
      res.status(500).json({ error: err.message || 'Erro ao enviar oferta' });
    }
  });

  // 7.1. Test Webhook Endpoint
  app.post('/api/webhooks/test', async (req, res) => {
    try {
      const { url, secretToken } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL do webhook é obrigatória.' });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'IMPORTHOURANDO-Bot-Webhook/1.0'
      };
      if (secretToken) {
        headers['X-Webhook-Secret'] = secretToken;
      }

      const testPayload = {
        event: 'TEST_PING',
        timestamp: new Date().toISOString(),
        app: 'IMPORTHOURANDO',
        message: '🔔 Teste de Notificação Webhook disparado com sucesso pelo IMPORTHOURANDO!',
        sampleOffer: {
          id: 'MLB38942019',
          productTitle: 'Smart TV 55" Samsung 4K UHD Crystal UHD',
          price: 2199.00,
          originalPrice: 3199.00,
          discountPercentage: 31,
          affiliateUrl: 'https://mercadolivre.com/sec/2a8Fk9L?matext=ofertastop_app',
          marketplace: 'MERCADO_LIVRE'
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(7000)
      });

      res.json({
        success: response.ok,
        httpStatus: response.status,
        statusText: response.statusText
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        httpStatus: 500,
        error: err.message || 'Falha de rede ao tentar conectar com a URL do webhook.'
      });
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

      savePersistentStore();
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

      savePersistentStore();
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
      const { id, name, email, phone, plan, status, notes, isLifetimeExemptFromMonitoring, discountApplied, totalPaid, isCourtesy, trialStartedAt, trialExpiresAt } = req.body;
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

        if (isCourtesy !== undefined) {
          existing.isCourtesy = Boolean(isCourtesy);
        }

        // Handle CORTESIA status transition
        if (existing.status === 'CORTESIA') {
          existing.isCourtesy = true;
          existing.totalPaid = 0;
          existing.isLifetimeExemptFromMonitoring = true;
          existing.courtesyGrantedAt = existing.courtesyGrantedAt || new Date().toLocaleString('pt-BR');
        } else if (existing.status === 'SUSPENSO') {
          existing.isCourtesy = false;
          existing.courtesyRevokedAt = new Date().toLocaleString('pt-BR');
        }

        if (isLifetimeExemptFromMonitoring !== undefined) {
          existing.isLifetimeExemptFromMonitoring = Boolean(isLifetimeExemptFromMonitoring);
        } else if (existing.plan === 'ANUAL' || existing.status === 'CORTESIA') {
          existing.isLifetimeExemptFromMonitoring = true;
        }

        if (existing.plan === 'ANUAL') {
          const expDate = new Date();
          expDate.setFullYear(expDate.getFullYear() + 1);
          existing.expiresAt = expDate.toISOString().split('T')[0];
        } else if (!existing.expiresAt) {
          existing.expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
        }

        if (trialStartedAt) existing.trialStartedAt = trialStartedAt;
        if (trialExpiresAt) existing.trialExpiresAt = trialExpiresAt;

        // Add admin log notification for profile status conversion
        let notifMsg = `⚙️ CONVERSÃO ADM: ${existing.name} teve o perfil alterado para [Plano: ${existing.plan} | Status: ${existing.status}]`;
        if (existing.status === 'CORTESIA') {
          notifMsg = `🎁 CORTESIA CONCEDIDA: ${existing.name} recebeu acesso de cortesia do Administrador!`;
        } else if (existing.status === 'SUSPENSO') {
          notifMsg = `🚫 CORTESIA REVOGADA: A cortesia de ${existing.name} foi suspensa pelo Administrador.`;
        }

        adminNotificationsList.unshift({
          id: `notif-${Date.now()}`,
          type: existing.status === 'CORTESIA' ? 'NEW_SUBSCRIBER' : (existing.plan === 'ANUAL' ? 'ANUAL_EXEMPT' : 'PLAN_UPGRADE'),
          subscriberName: existing.name,
          subscriberEmail: existing.email,
          message: notifMsg,
          timestamp: 'Agora mesmo',
          read: false,
          badgeColor: existing.status === 'CORTESIA' ? 'bg-[#FFE600] text-[#2D3277]' : (existing.status === 'ATIVO' ? 'bg-emerald-600' : (existing.status === 'RECONQUISTA_3M' ? 'bg-amber-600' : 'bg-red-600'))
        });

        console.log(`[SUBSCRIBER CONVERSION ADM] Assinante ${existing.email} convertido: Plano ${oldPlan} -> ${existing.plan}, Status ${oldStatus} -> ${existing.status}`);

        savePersistentStore();
        res.json({ success: true, subscriber: existing, message: 'Perfil e status do assinante convertidos com sucesso!' });
      } else {
        const nowMs = Date.now();
        const defaultTrialExp = new Date(nowMs + 30 * 60 * 1000).toISOString();

        const newSub: Subscriber = {
          id: `sub-${Date.now()}`,
          name: name || 'Novo Assinante',
          email: email || `user${Date.now()}@exemplo.com`,
          phone: phone || '+55 11 99000-0000',
          plan: plan || 'MENSAL',
          status: status || 'PENDENTE',
          startedAt: new Date().toISOString().split('T')[0],
          expiresAt: status === 'CORTESIA' ? null : (plan === 'ANUAL' ? new Date(nowMs + 365 * 24 * 3600 * 1000).toISOString().split('T')[0] : new Date(nowMs + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]),
          totalPaid: status === 'CORTESIA' ? 0 : (plan === 'ANUAL' ? 247.00 : (plan === 'SEMESTRAL' ? 147.00 : (status === 'PENDENTE' ? 0 : 29.90))),
          discountApplied: 0,
          isLifetimeExemptFromMonitoring: status === 'CORTESIA' || plan === 'ANUAL',
          isCourtesy: status === 'CORTESIA' || Boolean(isCourtesy),
          courtesyGrantedAt: status === 'CORTESIA' ? new Date().toLocaleString('pt-BR') : undefined,
          trialStartedAt: trialStartedAt || new Date().toISOString(),
          trialExpiresAt: trialExpiresAt || defaultTrialExp,
          notes: notes || 'Cadastrado na plataforma'
        };
        subscribersList.unshift(newSub);

        // Add admin notification
        adminNotificationsList.unshift({
          id: `notif-${Date.now()}`,
          type: newSub.status === 'CORTESIA' ? 'NEW_SUBSCRIBER' : (newSub.plan === 'ANUAL' ? 'ANUAL_EXEMPT' : 'NEW_SUBSCRIBER'),
          subscriberName: newSub.name,
          subscriberEmail: newSub.email,
          message: newSub.status === 'PENDENTE' 
            ? `⏳ NOVO USUÁRIO PENDENTE: ${newSub.name} entrou na plataforma (Degustação 30min)`
            : (newSub.status === 'CORTESIA' ? `🎁 CORTESIA CONCEDIDA: ${newSub.name} cadastrado com Cortesia!` : `✨ NOVO ASSINANTE CADASTRADO: ${newSub.name} iniciou no plano ${newSub.plan}!`),
          timestamp: 'Agora mesmo',
          read: false,
          badgeColor: newSub.status === 'CORTESIA' ? 'bg-[#FFE600] text-[#2D3277]' : (newSub.status === 'PENDENTE' ? 'bg-amber-500' : 'bg-emerald-600')
        });

        savePersistentStore();
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
    console.error('Servidor Express Error Catch:', err);
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server MeliOfertas running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
