import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { createToken } from '@/lib/jwt';
import { getUserApps, getCookieName } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { User, LoginRequest } from '@/lib/types';
import { checkRateLimit, resetRateLimit, getResetTime } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Rate limiting: 5 attempts per 15 minutes per IP
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = checkRateLimit(clientIp, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5,
    });

    if (!rateLimitResult.allowed) {
      const resetIn = getResetTime(rateLimitResult.resetAt);
      return NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${resetIn} seconds.`,
          retryAfter: resetIn,
        },
        { status: 429 }
      );
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | null;

    if (!user) {
      logAudit({
        userId: null,
        action: 'LOGIN_FAILED',
        details: { username, reason: 'User not found' },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      logAudit({
        userId: user.id,
        action: 'LOGIN_FAILED',
        details: { reason: 'Account disabled' },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });

      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      logAudit({
        userId: user.id,
        action: 'LOGIN_FAILED',
        details: { reason: 'Invalid password' },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const apps = getUserApps(user.id);

    const token = await createToken({
      sub: user.id,
      username: user.username,
      name: user.name,
      isAdmin: user.is_admin === 1,
      mustChangePassword: user.must_change_password === 1,
      apps,
    });

    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(Date.now(), user.id);

    // Reset rate limit on successful login
    resetRateLimit(clientIp);

    logAudit({
      userId: user.id,
      action: 'LOGIN',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        isAdmin: user.is_admin === 1,
        mustChangePassword: user.must_change_password === 1,
      },
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
