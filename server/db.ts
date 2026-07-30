import initSqlJs, { Database } from 'sql.js';
import pg from 'pg';
import path from 'path';
import fs from 'fs';

// Database selection: Uses PostgreSQL if DATABASE_URL is set, otherwise local SQLite database file
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export type DbEngine = 'SQLITE' | 'POSTGRES';
export let currentDbEngine: DbEngine = DATABASE_URL ? 'POSTGRES' : 'SQLITE';

let sqliteDb: Database | null = null;
let pgPool: pg.Pool | null = null;

const DB_FILE = path.join(process.cwd(), 'database.sqlite');

/**
 * Persists the in-memory SQLite database to database.sqlite file on disk
 */
function saveSqliteDisk() {
  if (!sqliteDb) return;
  try {
    const data = sqliteDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('[DATABASE] Error writing SQLite file to disk:', err);
  }
}

/**
 * Initialize Database Connection and Auto-Migrate Tables
 */
export async function initDatabase(): Promise<void> {
  if (DATABASE_URL) {
    try {
      console.log('[DATABASE] Connecting to PostgreSQL Database...');
      pgPool = new pg.Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      await pgPool.query('SELECT 1');
      currentDbEngine = 'POSTGRES';
      console.log('[DATABASE] PostgreSQL connected successfully!');
      await migratePostgresSchema();
      return;
    } catch (err) {
      console.warn('[DATABASE] Could not connect to PostgreSQL, falling back to SQLite:', err);
      currentDbEngine = 'SQLITE';
    }
  }

  // SQLite Setup using WASM sql.js (no native glibc binding dependencies)
  console.log('[DATABASE] Initializing SQLite (sql.js) Database at', DB_FILE);
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      sqliteDb = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('[DATABASE] Existing database.sqlite corrupt or unreadable, creating fresh DB:', e);
      sqliteDb = new SQL.Database();
    }
  } else {
    sqliteDb = new SQL.Database();
  }

  await migrateSqliteSchema();
  saveSqliteDisk();
  console.log('[DATABASE] SQLite (sql.js) initialized and tables ready!');
}

/**
 * Execute a SQL query (supporting both SQLite and Postgres params syntax)
 */
export async function querySql<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (currentDbEngine === 'POSTGRES' && pgPool) {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows as T[];
  }

  if (!sqliteDb) {
    throw new Error('SQLite database not initialized');
  }

  try {
    const stmt = sqliteDb.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }

    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();

    // Save changes if this was a write query
    const upper = sql.trim().toUpperCase();
    if (upper.startsWith('INSERT') || upper.startsWith('UPDATE') || upper.startsWith('DELETE') || upper.startsWith('CREATE')) {
      saveSqliteDisk();
    }

    return results;
  } catch (err) {
    console.error('[DATABASE QUERY ERROR]', err, sql);
    throw err;
  }
}

/**
 * Execute a write SQL statement (INSERT / UPDATE / DELETE)
 */
export async function execSql(sql: string, params: any[] = []): Promise<void> {
  if (currentDbEngine === 'POSTGRES' && pgPool) {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    await pgPool.query(pgSql, params);
    return;
  }

  if (!sqliteDb) {
    throw new Error('SQLite database not initialized');
  }

  try {
    sqliteDb.run(sql, params);
    saveSqliteDisk();
  } catch (err) {
    console.error('[DATABASE EXEC ERROR]', err, sql);
    throw err;
  }
}

/**
 * SQLite Schema Migration
 */
async function migrateSqliteSchema() {
  await execSql(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      phone TEXT,
      plan TEXT DEFAULT 'MENSAL',
      status TEXT DEFAULT 'PENDENTE',
      started_at TEXT,
      expires_at TEXT,
      total_paid REAL DEFAULT 0,
      discount_applied REAL DEFAULT 0,
      is_lifetime_exempt INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await execSql(`
    CREATE TABLE IF NOT EXISTS used_trial_ips (
      ip_or_fp TEXT PRIMARY KEY,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await execSql(`
    CREATE TABLE IF NOT EXISTS affiliate_configs (
      id INTEGER PRIMARY KEY DEFAULT 1,
      ml_app_id TEXT,
      ml_secret_key TEXT,
      ml_access_token TEXT,
      ml_refresh_token TEXT,
      ml_user_id TEXT,
      ml_tag TEXT,
      ml_domain TEXT,
      shopee_app_id TEXT,
      shopee_secret TEXT,
      shopee_link TEXT,
      amazon_associate_tag TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await execSql(`
    CREATE TABLE IF NOT EXISTS admin_notifications (
      id TEXT PRIMARY KEY,
      type TEXT,
      subscriber_name TEXT,
      subscriber_email TEXT,
      message TEXT,
      timestamp TEXT,
      read_status INTEGER DEFAULT 0,
      badge_color TEXT
    )
  `);

  // Seed default admin accounts if empty
  const existingAdmin = await querySql('SELECT id FROM subscribers WHERE email = ?', ['gregoriojr2003@gmail.com']);
  if (existingAdmin.length === 0) {
    await execSql(`
      INSERT INTO subscribers (id, name, email, password, phone, plan, status, started_at, expires_at, total_paid, is_lifetime_exempt, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'admin-1',
      'Proprietário (Admin Master)',
      'gregoriojr2003@gmail.com',
      '123456',
      '+55 (11) 99999-8888',
      'ANUAL',
      'ATIVO',
      new Date().toISOString().split('T')[0],
      '2099-12-31',
      0,
      1,
      'Super Admin com isenção vitalícia'
    ]);
  }
}

/**
 * PostgreSQL Schema Migration
 */
async function migratePostgresSchema() {
  if (!pgPool) return;

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      phone VARCHAR(255),
      plan VARCHAR(50) DEFAULT 'MENSAL',
      status VARCHAR(50) DEFAULT 'PENDENTE',
      started_at VARCHAR(50),
      expires_at VARCHAR(50),
      total_paid NUMERIC DEFAULT 0,
      discount_applied NUMERIC DEFAULT 0,
      is_lifetime_exempt INTEGER DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS used_trial_ips (
      ip_or_fp VARCHAR(255) PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS affiliate_configs (
      id INT PRIMARY KEY DEFAULT 1,
      ml_app_id VARCHAR(255),
      ml_secret_key VARCHAR(255),
      ml_access_token TEXT,
      ml_refresh_token TEXT,
      ml_user_id VARCHAR(255),
      ml_tag VARCHAR(255),
      ml_domain VARCHAR(255),
      shopee_app_id VARCHAR(255),
      shopee_secret VARCHAR(255),
      shopee_link VARCHAR(255),
      amazon_associate_tag VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_notifications (
      id VARCHAR(255) PRIMARY KEY,
      type VARCHAR(100),
      subscriber_name VARCHAR(255),
      subscriber_email VARCHAR(255),
      message TEXT,
      timestamp VARCHAR(100),
      read_status INT DEFAULT 0,
      badge_color VARCHAR(100)
    );
  `);

  const res = await pgPool.query('SELECT id FROM subscribers WHERE email = $1', ['gregoriojr2003@gmail.com']);
  if (res.rows.length === 0) {
    await pgPool.query(`
      INSERT INTO subscribers (id, name, email, password, phone, plan, status, started_at, expires_at, total_paid, is_lifetime_exempt, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      'admin-1',
      'Proprietário (Admin Master)',
      'gregoriojr2003@gmail.com',
      '123456',
      '+55 (11) 99999-8888',
      'ANUAL',
      'ATIVO',
      new Date().toISOString().split('T')[0],
      '2099-12-31',
      0,
      1,
      'Super Admin com isenção vitalícia'
    ]);
  }
}
