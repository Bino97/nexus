import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { Application, CreateAppRequest } from '@/lib/types';

// GET /api/apps - List all applications
export async function GET() {
  try {
    await requireAdmin();

    const apps = db.prepare(`
      SELECT * FROM applications ORDER BY sort_order, name
    `).all();

    return NextResponse.json({ apps });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Get apps error:', error);
    return NextResponse.json({ error: 'Failed to get apps' }, { status: 500 });
  }
}

// POST /api/apps - Create new application
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body: CreateAppRequest = await request.json();
    const { name, slug, description, base_url, icon, color, uses_nexus_auth } = body;

    if (!name || !slug || !base_url) {
      return NextResponse.json(
        { error: 'Name, slug, and base_url are required' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    const existing = db.prepare('SELECT id FROM applications WHERE slug = ?').get(slug) as Application | null;
    if (existing) {
      return NextResponse.json(
        { error: 'An application with this slug already exists' },
        { status: 409 }
      );
    }

    const appId = uuidv4();
    const now = Date.now();

    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM applications').get() as { max: number | null };
    const sortOrder = (maxOrder.max || 0) + 1;

    db.prepare(`
      INSERT INTO applications (id, name, slug, description, base_url, icon, color, is_active, sort_order, uses_nexus_auth, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).run(appId, name, slug, description || null, base_url, icon || null, color || null, sortOrder, uses_nexus_auth !== false ? 1 : 0, now, now);

    logAudit({
      userId: session.id,
      action: 'APP_CREATED',
      targetType: 'app',
      targetId: appId,
      details: { name, slug, base_url },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);

    return NextResponse.json({ success: true, app });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Create app error:', error);
    return NextResponse.json({ error: 'Failed to create app' }, { status: 500 });
  }
}
