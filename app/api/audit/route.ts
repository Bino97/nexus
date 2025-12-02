import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

interface AuditLogRow {
  id: number;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: string | null;
  created_at: number;
  username?: string;
}

// GET /api/audit - Get audit logs
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const action = searchParams.get('action');
    const userId = searchParams.get('user_id');

    let query = `
      SELECT al.*, u.username
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (action) {
      conditions.push('al.action = ?');
      params.push(action);
    }

    if (userId) {
      conditions.push('al.user_id = ?');
      params.push(userId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = db.prepare(query).all(...params) as AuditLogRow[];

    let countQuery = 'SELECT COUNT(*) as total FROM audit_log al';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const countParams = params.slice(0, -2);
    const countResult = db.prepare(countQuery).get(...countParams) as { total: number };

    return NextResponse.json({
      logs,
      total: countResult.total,
      limit,
      offset,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Get audit logs error:', error);
    return NextResponse.json({ error: 'Failed to get audit logs' }, { status: 500 });
  }
}
