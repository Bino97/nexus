import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { Setting } from '@/lib/types';

// GET /api/settings - Get all settings
export async function GET() {
  try {
    await requireAdmin();

    const settings = db.prepare('SELECT * FROM settings').all() as Setting[];

    const settingsObj: Record<string, string> = {};
    for (const s of settings) {
      settingsObj[s.key] = s.value;
    }

    return NextResponse.json({ settings: settingsObj });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    const now = Date.now();
    const changes: Record<string, string> = {};

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        const existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);

        if (existing) {
          db.prepare('UPDATE settings SET value = ?, updated_at = ? WHERE key = ?')
            .run(value, now, key);
        } else {
          db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)')
            .run(key, value, now);
        }

        changes[key] = value;
      }
    }

    logAudit({
      userId: session.id,
      action: 'SETTINGS_UPDATED',
      targetType: 'settings',
      details: changes,
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
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
