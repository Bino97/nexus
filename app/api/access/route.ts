import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// GET /api/access - Get access matrix (all users with their app access)
export async function GET() {
  try {
    await requireAdmin();

    const users = db.prepare(`
      SELECT id, username, name, is_admin, is_active
      FROM users
      ORDER BY username
    `).all();

    const apps = db.prepare(`
      SELECT id, name, slug, is_active
      FROM applications
      WHERE uses_nexus_auth = 1
      ORDER BY sort_order, name
    `).all();

    const access = db.prepare(`
      SELECT user_id, app_id
      FROM user_app_access
    `).all() as { user_id: string; app_id: string }[];

    const accessMap: Record<string, string[]> = {};
    for (const a of access) {
      if (!accessMap[a.user_id]) {
        accessMap[a.user_id] = [];
      }
      accessMap[a.user_id].push(a.app_id);
    }

    return NextResponse.json({ users, apps, accessMap });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Get access error:', error);
    return NextResponse.json({ error: 'Failed to get access matrix' }, { status: 500 });
  }
}

// POST /api/access - Grant or revoke access
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { user_id, app_id, grant } = body;

    if (!user_id || !app_id || grant === undefined) {
      return NextResponse.json(
        { error: 'user_id, app_id, and grant are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(user_id) as { id: string; username: string } | null;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const app = db.prepare('SELECT id, name, slug FROM applications WHERE id = ?').get(app_id) as { id: string; name: string; slug: string } | null;
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (grant) {
      const existing = db.prepare(
        'SELECT * FROM user_app_access WHERE user_id = ? AND app_id = ?'
      ).get(user_id, app_id);

      if (!existing) {
        db.prepare(`
          INSERT INTO user_app_access (user_id, app_id, granted_at, granted_by)
          VALUES (?, ?, ?, ?)
        `).run(user_id, app_id, Date.now(), session.id);

        logAudit({
          userId: session.id,
          action: 'ACCESS_GRANTED',
          targetType: 'access',
          targetId: `${user_id}:${app_id}`,
          details: { username: user.username, app_name: app.name, app_slug: app.slug },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent'),
        });
      }
    } else {
      const result = db.prepare(
        'DELETE FROM user_app_access WHERE user_id = ? AND app_id = ?'
      ).run(user_id, app_id);

      if (result.changes > 0) {
        logAudit({
          userId: session.id,
          action: 'ACCESS_REVOKED',
          targetType: 'access',
          targetId: `${user_id}:${app_id}`,
          details: { username: user.username, app_name: app.name, app_slug: app.slug },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent'),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Update access error:', error);
    return NextResponse.json({ error: 'Failed to update access' }, { status: 500 });
  }
}

// PUT /api/access - Bulk update access for a user
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { user_id, app_ids } = body;

    if (!user_id || !Array.isArray(app_ids)) {
      return NextResponse.json(
        { error: 'user_id and app_ids array are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(user_id) as { id: string; username: string } | null;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentAccess = db.prepare(
      'SELECT app_id FROM user_app_access WHERE user_id = ?'
    ).all(user_id) as { app_id: string }[];
    const currentAppIds = new Set(currentAccess.map(a => a.app_id));
    const newAppIds = new Set(app_ids);

    for (const appId of currentAppIds) {
      if (!newAppIds.has(appId)) {
        db.prepare('DELETE FROM user_app_access WHERE user_id = ? AND app_id = ?').run(user_id, appId);
      }
    }

    const now = Date.now();
    for (const appId of newAppIds) {
      if (!currentAppIds.has(appId)) {
        db.prepare(`
          INSERT INTO user_app_access (user_id, app_id, granted_at, granted_by)
          VALUES (?, ?, ?, ?)
        `).run(user_id, appId, now, session.id);
      }
    }

    logAudit({
      userId: session.id,
      action: 'ACCESS_GRANTED',
      targetType: 'access',
      targetId: user_id,
      details: { username: user.username, app_count: app_ids.length },
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
    console.error('Bulk update access error:', error);
    return NextResponse.json({ error: 'Failed to update access' }, { status: 500 });
  }
}
