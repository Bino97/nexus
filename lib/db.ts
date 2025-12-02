import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(process.cwd(), 'nexus.db');

const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      must_change_password INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_login_at INTEGER,
      created_by TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      base_url TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      health_check_enabled INTEGER DEFAULT 1,
      health_status TEXT DEFAULT 'unknown',
      last_health_check INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_app_access (
      user_id TEXT NOT NULL,
      app_id TEXT NOT NULL,
      granted_at INTEGER NOT NULL,
      granted_by TEXT,
      PRIMARY KEY (user_id, app_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      view_mode TEXT DEFAULT 'grid-comfortable',
      accent_color TEXT DEFAULT '#3b82f6',
      show_url INTEGER DEFAULT 1,
      app_order TEXT,
      favorite_apps TEXT,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS branding (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      site_name TEXT DEFAULT 'NEXUS',
      site_tagline TEXT DEFAULT 'Application Hub',
      logo_url TEXT,
      primary_color TEXT DEFAULT '#3b82f6',
      updated_at INTEGER NOT NULL,
      updated_by TEXT
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_access_user ON user_app_access(user_id);
    CREATE INDEX IF NOT EXISTS idx_access_app ON user_app_access(app_id);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

  if (userCount.count === 0) {
    const adminId = uuidv4();
    const now = Date.now();
    const passwordHash = bcrypt.hashSync('admin', 12);

    db.prepare(`
      INSERT INTO users (id, username, name, password_hash, is_admin, is_active, must_change_password, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, 1, 1, ?, ?)
    `).run(adminId, 'admin', 'Administrator', passwordHash, now, now);

    console.log('Created default admin user (username: admin, password: admin)');
  }

  const hostSetting = db.prepare('SELECT * FROM settings WHERE key = ?').get('nexus_host');
  if (!hostSetting) {
    db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)')
      .run('nexus_host', 'localhost', Date.now());
  }

  const portSetting = db.prepare('SELECT * FROM settings WHERE key = ?').get('nexus_port');
  if (!portSetting) {
    db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)')
      .run('nexus_port', '4000', Date.now());
  }

  const branding = db.prepare('SELECT * FROM branding WHERE id = 1').get();
  if (!branding) {
    db.prepare('INSERT INTO branding (id, site_name, site_tagline, logo_url, primary_color, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(1, 'NEXUS', 'Application Hub', null, '#3b82f6', Date.now());
  }

  runMigrations();
}

function runMigrations() {
  const appsTableInfo = db.prepare("PRAGMA table_info(applications)").all() as Array<{ name: string }>;
  const appsColumnNames = appsTableInfo.map(col => col.name);

  if (!appsColumnNames.includes('health_check_enabled')) {
    console.log('Running migration: Adding health check columns to applications table');
    db.exec(`
      ALTER TABLE applications ADD COLUMN health_check_enabled INTEGER DEFAULT 1;
    `);
  }

  if (!appsColumnNames.includes('health_status')) {
    db.exec(`
      ALTER TABLE applications ADD COLUMN health_status TEXT DEFAULT 'unknown';
    `);
  }

  if (!appsColumnNames.includes('last_health_check')) {
    db.exec(`
      ALTER TABLE applications ADD COLUMN last_health_check INTEGER;
    `);
  }

  if (!appsColumnNames.includes('uses_nexus_auth')) {
    console.log('Running migration: Adding uses_nexus_auth column to applications table');
    db.exec(`
      ALTER TABLE applications ADD COLUMN uses_nexus_auth INTEGER DEFAULT 1;
    `);
  }

  const prefsTableInfo = db.prepare("PRAGMA table_info(user_preferences)").all() as Array<{ name: string }>;
  const prefsColumnNames = prefsTableInfo.map(col => col.name);

  if (!prefsColumnNames.includes('background_url')) {
    console.log('Running migration: Adding background_url column to user_preferences table');
    db.exec(`
      ALTER TABLE user_preferences ADD COLUMN background_url TEXT;
    `);
  }

  if (!prefsColumnNames.includes('card_opacity')) {
    console.log('Running migration: Adding card_opacity column to user_preferences table');
    db.exec(`
      ALTER TABLE user_preferences ADD COLUMN card_opacity INTEGER DEFAULT 100;
    `);
  }
}

initializeDatabase();

export default db;
