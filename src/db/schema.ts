import { pgTable, serial, text, timestamp, boolean, integer, real } from 'drizzle-orm/pg-core';

// Users table (Stores both Email/Password & Google Auth users)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID or generated local UID
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // Null for Google OAuth users
  phone: text('phone'),
  role: text('role').notNull().default('SUBSCRIBER'), // 'ADMIN' | 'SUBSCRIBER'
  plan: text('plan').notNull().default('MENSAL'), // 'MENSAL' | 'SEMESTRAL' | 'ANUAL'
  status: text('status').notNull().default('ATIVO'), // 'ATIVO' | 'CANCELADO' | 'PENDENTE' | 'SUSPENSO'
  startedAt: text('started_at'),
  expiresAt: text('expires_at'),
  totalPaid: real('total_paid').default(0),
  discountApplied: integer('discount_applied').default(0),
  isLifetimeExemptFromMonitoring: boolean('is_lifetime_exempt').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Verification Codes (PINs for registration & WhatsApp OTP)
export const verificationCodes = pgTable('verification_codes', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  type: text('type').notNull().default('REGISTER'), // 'REGISTER' | 'WHATSAPP_OTP'
  userData: text('user_data'), // JSON payload for pending registration details
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// WhatsApp Channels table
export const channels = pgTable('channels', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull().default('CHANNEL'), // 'CHANNEL' | 'GROUP' | 'BROADCAST' | 'STATUS'
  phoneNumberOrJid: text('phone_number_or_jid').notNull(),
  inviteLink: text('invite_link'),
  membersCount: integer('members_count').default(0),
  status: text('status').default('CONNECTED'), // 'CONNECTED' | 'DISCONNECTED' | 'PENDING'
  autoPost: boolean('auto_post').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Dispatched Offers history table
export const dispatchedOffers = pgTable('dispatched_offers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  productId: text('product_id').notNull(),
  productTitle: text('product_title').notNull(),
  productImage: text('product_image').notNull(),
  price: real('price').notNull(),
  originalPrice: real('original_price').notNull(),
  affiliateUrl: text('affiliate_url').notNull(),
  channelId: text('channel_id').notNull(),
  channelName: text('channel_name').notNull(),
  messageText: text('message_text').notNull(),
  sentAt: text('sent_at').notNull(),
  status: text('status').default('ENVIADO'),
  clicksCount: integer('clicks_count').default(0),
  estimatedComission: real('estimated_comission').default(0),
  marketplace: text('marketplace').default('MERCADO_LIVRE'),
  createdAt: timestamp('created_at').defaultNow(),
});

// User Configurations table (Affiliate keys, bot settings, brand voice, webhooks)
export const userConfigs = pgTable('user_configs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  configJson: text('config_json').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
