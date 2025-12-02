import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { Application } from '@/lib/types';

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { appId } = await req.json();

  if (!appId) {
    return NextResponse.json({ error: 'App ID required' }, { status: 400 });
  }

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId) as Application;

  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const status = await checkAppHealth(app.base_url);

  db.prepare(`
    UPDATE applications
    SET health_status = ?, last_health_check = ?
    WHERE id = ?
  `).run(status, Date.now(), appId);

  return NextResponse.json({ status, appId });
}

export async function GET() {
  const session = await getSession();

  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apps = db.prepare('SELECT * FROM applications WHERE health_check_enabled = 1').all() as Application[];

  const results = await Promise.all(
    apps.map(async (app) => {
      const status = await checkAppHealth(app.base_url);

      db.prepare(`
        UPDATE applications
        SET health_status = ?, last_health_check = ?
        WHERE id = ?
      `).run(status, Date.now(), app.id);

      return { id: app.id, name: app.name, status };
    })
  );

  return NextResponse.json({ results });
}

async function checkAppHealth(baseUrl: string): Promise<'online' | 'offline' | 'unknown'> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${baseUrl}/api/nexus/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'NEXUS-Health-Check/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return 'online';
    } else {
      return 'offline';
    }
  } catch (error) {
    return 'offline';
  }
}
