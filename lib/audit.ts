import db from './db';

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'APP_CREATED'
  | 'APP_UPDATED'
  | 'APP_DELETED'
  | 'ACCESS_GRANTED'
  | 'ACCESS_REVOKED'
  | 'SETTINGS_UPDATED';

export type TargetType = 'user' | 'app' | 'access' | 'settings' | null;

interface AuditLogEntry {
  userId: string | null;
  action: AuditAction;
  targetType?: TargetType;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown> | null;
}

export function logAudit(entry: AuditLogEntry): void {
  const stmt = db.prepare(`
    INSERT INTO audit_log (user_id, action, target_type, target_id, ip_address, user_agent, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    entry.userId,
    entry.action,
    entry.targetType || null,
    entry.targetId || null,
    entry.ipAddress || null,
    entry.userAgent || null,
    entry.details ? JSON.stringify(entry.details) : null,
    Date.now()
  );
}

export function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  userId?: string;
  action?: AuditAction;
}) {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  let query = 'SELECT * FROM audit_log';
  const params: (string | number)[] = [];
  const conditions: string[] = [];

  if (options?.userId) {
    conditions.push('user_id = ?');
    params.push(options.userId);
  }

  if (options?.action) {
    conditions.push('action = ?');
    params.push(options.action);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}
