import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { Application, UpdateAppRequest } from '@/lib/types';

// GET /api/apps/[id] - Get application by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ app });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Get app error:', error);
    return NextResponse.json({ error: 'Failed to get app' }, { status: 500 });
  }
}

// PUT /api/apps/[id] - Update application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body: UpdateAppRequest = await request.json();

    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as Application | null;
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    const changes: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
      changes.name = body.name;
    }

    if (body.slug !== undefined) {
      if (!/^[a-z0-9-]+$/.test(body.slug)) {
        return NextResponse.json(
          { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
          { status: 400 }
        );
      }
      const existing = db.prepare('SELECT id FROM applications WHERE slug = ? AND id != ?').get(body.slug, id);
      if (existing) {
        return NextResponse.json(
          { error: 'An application with this slug already exists' },
          { status: 409 }
        );
      }
      updates.push('slug = ?');
      values.push(body.slug);
      changes.slug = body.slug;
    }

    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description || null);
      changes.description = body.description;
    }

    if (body.base_url !== undefined) {
      updates.push('base_url = ?');
      values.push(body.base_url);
      changes.base_url = body.base_url;
    }

    if (body.icon !== undefined) {
      updates.push('icon = ?');
      values.push(body.icon || null);
      changes.icon = body.icon;
    }

    if (body.color !== undefined) {
      updates.push('color = ?');
      values.push(body.color || null);
      changes.color = body.color;
    }

    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(body.is_active ? 1 : 0);
      changes.is_active = body.is_active;
    }

    if (body.sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(body.sort_order);
      changes.sort_order = body.sort_order;
    }

    if (body.uses_nexus_auth !== undefined) {
      updates.push('uses_nexus_auth = ?');
      values.push(body.uses_nexus_auth ? 1 : 0);
      changes.uses_nexus_auth = body.uses_nexus_auth;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    updates.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    db.prepare(`UPDATE applications SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    logAudit({
      userId: session.id,
      action: 'APP_UPDATED',
      targetType: 'app',
      targetId: id,
      details: changes,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    const updatedApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);

    return NextResponse.json({ success: true, app: updatedApp });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Update app error:', error);
    return NextResponse.json({ error: 'Failed to update app' }, { status: 500 });
  }
}

// DELETE /api/apps/[id] - Delete application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as Application | null;
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM applications WHERE id = ?').run(id);

    logAudit({
      userId: session.id,
      action: 'APP_DELETED',
      targetType: 'app',
      targetId: id,
      details: { name: app.name, slug: app.slug },
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
    console.error('Delete app error:', error);
    return NextResponse.json({ error: 'Failed to delete app' }, { status: 500 });
  }
}
