import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { User, CreateUserRequest } from '@/lib/types';
import { validatePassword } from '@/lib/password-validator';

// GET /api/users - List all users
export async function GET() {
  try {
    await requireAdmin();

    const users = db.prepare(`
      SELECT id, username, name, is_admin, is_active, must_change_password, created_at, updated_at, last_login_at, created_by
      FROM users
      ORDER BY created_at DESC
    `).all();

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body: CreateUserRequest = await request.json();
    const { username, name, password, is_admin } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet complexity requirements',
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as User | null;
    if (existing) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    const userId = uuidv4();
    const now = Date.now();
    const passwordHash = await bcrypt.hash(password, 12);

    db.prepare(`
      INSERT INTO users (id, username, name, password_hash, is_admin, is_active, must_change_password, created_at, updated_at, created_by)
      VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
    `).run(userId, username, name || null, passwordHash, is_admin ? 1 : 0, now, now, session.id);

    logAudit({
      userId: session.id,
      action: 'USER_CREATED',
      targetType: 'user',
      targetId: userId,
      details: { username, name, is_admin: !!is_admin },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username,
        name: name || null,
        is_admin: is_admin ? 1 : 0,
        is_active: 1,
        must_change_password: 1,
        created_at: now,
        updated_at: now,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
