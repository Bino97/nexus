import db from '@/lib/db';
import { Users, AppWindow, Shield, Activity } from 'lucide-react';
import Link from 'next/link';

interface AuditLogRow {
  id: number;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  ip_address: string | null;
  created_at: number;
  username?: string;
}

export default function AdminDashboard() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };
  const activeUserCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get() as { count: number };

  const recentLogins = db.prepare(`
    SELECT al.*, u.username
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.action = 'LOGIN'
    ORDER BY al.created_at DESC
    LIMIT 5
  `).all() as AuditLogRow[];

  const stats = [
    {
      label: 'Total Users',
      value: userCount.count,
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Active Users',
      value: activeUserCount.count,
      icon: Shield,
      href: '/admin/users',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Applications',
      value: appCount.count,
      icon: AppWindow,
      href: '/admin/apps',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Recent Logins',
      value: recentLogins.length,
      icon: Activity,
      href: '/admin/audit',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground">Welcome to NEXUS Admin</p>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-border bg-card p-6 transition-colors hover:bg-card/80"
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/users/new"
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-secondary"
            >
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">Add User</span>
            </Link>
            <Link
              href="/admin/apps/new"
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-secondary"
            >
              <AppWindow className="h-5 w-5 text-primary" />
              <span className="font-medium">Add Application</span>
            </Link>
            <Link
              href="/admin/access"
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-secondary"
            >
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-medium">Manage Access</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-secondary"
            >
              <Activity className="h-5 w-5 text-primary" />
              <span className="font-medium">Settings</span>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Logins</h2>
          {recentLogins.length === 0 ? (
            <p className="text-muted-foreground">No recent login activity</p>
          ) : (
            <div className="space-y-3">
              {recentLogins.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {log.username || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground">{log.ip_address || 'Unknown IP'}</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/admin/audit"
            className="mt-4 block text-center text-sm text-primary hover:underline"
          >
            View all activity
          </Link>
        </div>
      </div>
    </div>
  );
}
