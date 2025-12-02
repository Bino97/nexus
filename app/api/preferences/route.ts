import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prefs = db.prepare(`
    SELECT * FROM user_preferences WHERE user_id = ?
  `).get(session.id) as any;

  if (!prefs) {
    // Return defaults
    return NextResponse.json({
      view_mode: 'grid-comfortable',
      accent_color: '#3b82f6',
      show_url: 1,
      app_order: null,
      favorite_apps: null,
      background_url: null,
      card_opacity: 100,
    });
  }

  return NextResponse.json({
    view_mode: prefs.view_mode,
    accent_color: prefs.accent_color,
    show_url: prefs.show_url,
    app_order: prefs.app_order ? JSON.parse(prefs.app_order) : null,
    favorite_apps: prefs.favorite_apps ? JSON.parse(prefs.favorite_apps) : [],
    background_url: prefs.background_url || null,
    card_opacity: prefs.card_opacity !== undefined ? prefs.card_opacity : 100,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { view_mode, accent_color, show_url, app_order, favorite_apps, background_url, card_opacity } = body;

  const existing = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(session.id);

  if (existing) {
    db.prepare(`
      UPDATE user_preferences
      SET view_mode = COALESCE(?, view_mode),
          accent_color = COALESCE(?, accent_color),
          show_url = COALESCE(?, show_url),
          app_order = COALESCE(?, app_order),
          favorite_apps = COALESCE(?, favorite_apps),
          background_url = COALESCE(?, background_url),
          card_opacity = COALESCE(?, card_opacity),
          updated_at = ?
      WHERE user_id = ?
    `).run(
      view_mode || null,
      accent_color || null,
      show_url !== undefined ? (show_url ? 1 : 0) : null,
      app_order ? JSON.stringify(app_order) : null,
      favorite_apps ? JSON.stringify(favorite_apps) : null,
      background_url !== undefined ? background_url : null,
      card_opacity !== undefined ? card_opacity : null,
      Date.now(),
      session.id
    );
  } else {
    db.prepare(`
      INSERT INTO user_preferences (user_id, view_mode, accent_color, show_url, app_order, favorite_apps, background_url, card_opacity, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id,
      view_mode || 'grid-comfortable',
      accent_color || '#3b82f6',
      show_url !== undefined ? (show_url ? 1 : 0) : 1,
      app_order ? JSON.stringify(app_order) : null,
      favorite_apps ? JSON.stringify(favorite_apps) : null,
      background_url || null,
      card_opacity !== undefined ? card_opacity : 100,
      Date.now()
    );
  }

  return NextResponse.json({ success: true });
}
