import { NextResponse } from 'next/server';
import { getSession, getCookieName } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST() {
  try {
    const session = await getSession();

    if (session) {
      logAudit({
        userId: session.id,
        action: 'LOGOUT',
      });
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set(getCookieName(), '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
