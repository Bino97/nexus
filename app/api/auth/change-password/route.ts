import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { getSession, getUserApps, getCookieName } from '@/lib/auth';
import { createToken } from '@/lib/jwt';
import { logAudit } from '@/lib/audit';
import { ChangePasswordRequest, User } from '@/lib/types';
import { validatePassword } from '@/lib/password-validator';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body: ChangePasswordRequest = await request.json();
    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate password complexity
    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet complexity requirements',
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.id) as User | null;

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(current_password, user.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    const newPasswordHash = await bcrypt.hash(new_password, 12);

    db.prepare(`
      UPDATE users
      SET password_hash = ?, must_change_password = 0, updated_at = ?
      WHERE id = ?
    `).run(newPasswordHash, Date.now(), user.id);

    logAudit({
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    const apps = getUserApps(user.id);

    const token = await createToken({
      sub: user.id,
      username: user.username,
      name: user.name,
      isAdmin: user.is_admin === 1,
      mustChangePassword: false,
      apps,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });

    response.cookies.set(getCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure cookies in production only
      sameSite: 'strict', // Prevent CSRF attacks
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
