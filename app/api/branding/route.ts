import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  const branding = db.prepare('SELECT * FROM branding WHERE id = 1').get() as any;

  if (!branding) {
    // Return defaults
    return NextResponse.json({
      site_name: 'NEXUS',
      site_tagline: 'Application Hub',
      logo_url: null,
      primary_color: '#3b82f6',
    });
  }

  return NextResponse.json({
    site_name: branding.site_name,
    site_tagline: branding.site_tagline,
    logo_url: branding.logo_url,
    primary_color: branding.primary_color,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { site_name, site_tagline, logo_url, primary_color } = body;

  const existing = db.prepare('SELECT * FROM branding WHERE id = 1').get();

  if (existing) {
    db.prepare(`
      UPDATE branding
      SET site_name = COALESCE(?, site_name),
          site_tagline = COALESCE(?, site_tagline),
          logo_url = ?,
          primary_color = COALESCE(?, primary_color),
          updated_at = ?,
          updated_by = ?
      WHERE id = 1
    `).run(
      site_name || null,
      site_tagline || null,
      logo_url !== undefined ? logo_url : null,
      primary_color || null,
      Date.now(),
      session.id
    );
  } else {
    db.prepare(`
      INSERT INTO branding (id, site_name, site_tagline, logo_url, primary_color, updated_at, updated_by)
      VALUES (1, ?, ?, ?, ?, ?, ?)
    `).run(
      site_name || 'NEXUS',
      site_tagline || 'Application Hub',
      logo_url || null,
      primary_color || '#3b82f6',
      Date.now(),
      session.id
    );
  }

  return NextResponse.json({ success: true });
}
