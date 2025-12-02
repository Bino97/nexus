'use client';

import { useState, useEffect } from 'react';
import { ScrollText, ChevronLeft, ChevronRight, User, Filter } from 'lucide-react';

interface AuditLog {
  id: number;
  user_id: string | null;
  username: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  ip_address: string | null;
  details: string | null;
  created_at: number;
}

const actionColors: Record<string, string> = {
  LOGIN: 'bg-green-500/10 text-green-500',
  LOGIN_FAILED: 'bg-red-500/10 text-red-500',
  LOGOUT: 'bg-gray-500/10 text-gray-500',
  PASSWORD_CHANGED: 'bg-blue-500/10 text-blue-500',
  USER_CREATED: 'bg-purple-500/10 text-purple-500',
  USER_UPDATED: 'bg-purple-500/10 text-purple-500',
  USER_DELETED: 'bg-red-500/10 text-red-500',
  APP_CREATED: 'bg-cyan-500/10 text-cyan-500',
  APP_UPDATED: 'bg-cyan-500/10 text-cyan-500',
  APP_DELETED: 'bg-red-500/10 text-red-500',
  ACCESS_GRANTED: 'bg-green-500/10 text-green-500',
  ACCESS_REVOKED: 'bg-orange-500/10 text-orange-500',
  SETTINGS_UPDATED: 'bg-yellow-500/10 text-yellow-500',
};

const actionLabels: Record<string, string> = {
  LOGIN: 'User Login',
  LOGIN_FAILED: 'Login Failed',
  LOGOUT: 'User Logout',
  PASSWORD_CHANGED: 'Password Changed',
  USER_CREATED: 'User Created',
  USER_UPDATED: 'User Updated',
  USER_DELETED: 'User Deleted',
  APP_CREATED: 'App Created',
  APP_UPDATED: 'App Updated',
  APP_DELETED: 'App Deleted',
  ACCESS_GRANTED: 'Access Granted',
  ACCESS_REVOKED: 'Access Revoked',
  SETTINGS_UPDATED: 'Settings Updated',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      if (actionFilter) {
        params.set('action', actionFilter);
      }

      const res = await fetch(`/api/audit?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatDetails = (details: string | null) => {
    if (!details) return null;
    try {
      const parsed = JSON.parse(details);
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch {
      return details;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground">View system activity and security events</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">Logins</option>
            <option value="LOGIN_FAILED">Failed Logins</option>
            <option value="USER_CREATED">User Created</option>
            <option value="USER_UPDATED">User Updated</option>
            <option value="USER_DELETED">User Deleted</option>
            <option value="APP_CREATED">App Created</option>
            <option value="APP_UPDATED">App Updated</option>
            <option value="APP_DELETED">App Deleted</option>
            <option value="ACCESS_GRANTED">Access Granted</option>
            <option value="ACCESS_REVOKED">Access Revoked</option>
            <option value="PASSWORD_CHANGED">Password Changed</option>
            <option value="SETTINGS_UPDATED">Settings Updated</option>
          </select>
        </div>
        <span className="text-sm text-muted-foreground">
          {total} total events
        </span>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">User</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Action</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Details</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm text-foreground">
                          {log.username || 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                          actionColors[log.action] || 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                      {formatDetails(log.details) || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
