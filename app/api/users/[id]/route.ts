import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { User, UpdateUserRequest } from '@/lib/types';
import { validatePassword } from '@/lib/password-validator';

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = db.prepare(`
      SELECT id, username, name, is_admin, is_active, must_change_password, created_at, updated_at, last_login_at, created_by
      FROM users WHERE id = ?
    `).get(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body: UpdateUserRequest = await request.json();

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | null;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];
    const changes: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name || '');
      changes.name = body.name;
    }

    if (body.password !== undefined) {
      // Validate password complexity
      const passwordValidation = validatePassword(body.password);
      if (!passwordValidation.valid) {
        return NextResponse.json(
          {
            error: 'Password does not meet complexity requirements',
            details: passwordValidation.errors,
          },
          { status: 400 }
        );
      }
      const passwordHash = await bcrypt.hash(body.password, 12);
      updates.push('password_hash = ?');
      values.push(passwordHash);
      changes.password = '***changed***';
    }

    if (body.is_admin !== undefined) {
      updates.push('is_admin = ?');
      values.push(body.is_admin ? 1 : 0);
      changes.is_admin = body.is_admin;
    }

    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(body.is_active ? 1 : 0);
      changes.is_active = body.is_active;
    }

    if (body.must_change_password !== undefined) {
      updates.push('must_change_password = ?');
      values.push(body.must_change_password ? 1 : 0);
      changes.must_change_password = body.must_change_password;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    updates.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    logAudit({
      userId: session.id,
      action: 'USER_UPDATED',
      targetType: 'user',
      targetId: id,
      details: changes,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    const updatedUser = db.prepare(`
      SELECT id, username, name, is_admin, is_active, must_change_password, created_at, updated_at, last_login_at
      FROM users WHERE id = ?
    `).get(id);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    if (id === session.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | null;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    logAudit({
      userId: session.id,
      action: 'USER_DELETED',
      targetType: 'user',
      targetId: id,
      details: { username: user.username },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
