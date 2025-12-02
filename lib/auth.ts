import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import db from './db';
import { User, SessionUser } from './types';

const COOKIE_NAME = 'nexus_token';

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    username: payload.username,
    name: payload.name,
    isAdmin: payload.isAdmin,
    mustChangePassword: payload.mustChangePassword,
    apps: payload.apps,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (!session.isAdmin) {
    throw new Error('Forbidden');
  }
  return session;
}

export function getUserById(id: string): User | null {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | null;
}

export function getUserByUsername(username: string): User | null {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | null;
}

export function getUserApps(userId: string): string[] {
  const rows = db.prepare(`
    SELECT a.slug
    FROM applications a
    INNER JOIN user_app_access ua ON a.id = ua.app_id
    WHERE ua.user_id = ? AND a.is_active = 1
  `).all(userId) as { slug: string }[];

  return rows.map(r => r.slug);
}

export function getCookieName(): string {
  return COOKIE_NAME;
}
