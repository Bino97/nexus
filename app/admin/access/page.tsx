'use client';

import { useState, useEffect } from 'react';
import { Grid3X3, Check, X, Users, AppWindow, Search } from 'lucide-react';

interface User {
  id: string;
  username: string;
  name: string | null;
  is_admin: number;
  is_active: number;
}

interface App {
  id: string;
  name: string;
  slug: string;
  is_active: number;
}

export default function AccessMatrixPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [accessMap, setAccessMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [appSearch, setAppSearch] = useState('');
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [showInactiveApps, setShowInactiveApps] = useState(false);

  useEffect(() => {
    fetchAccessMatrix();
  }, []);

  const fetchAccessMatrix = async () => {
    try {
      const res = await fetch('/api/access');
      const data = await res.json();
      setUsers(data.users || []);
      setApps(data.apps || []);
      setAccessMap(data.accessMap || {});
    } catch (error) {
      console.error('Failed to fetch access matrix:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccess = async (userId: string, appId: string) => {
    const key = `${userId}-${appId}`;
    setUpdating(key);

    const hasAccess = accessMap[userId]?.includes(appId);

    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          app_id: appId,
          grant: !hasAccess,
        }),
      });

      if (res.ok) {
        setAccessMap((prev) => {
          const newMap = { ...prev };
          if (!newMap[userId]) {
            newMap[userId] = [];
          }

          if (hasAccess) {
            newMap[userId] = newMap[userId].filter((id) => id !== appId);
          } else {
            newMap[userId] = [...newMap[userId], appId];
          }

          return newMap;
        });
      }
    } catch (error) {
      console.error('Failed to update access:', error);
    } finally {
      setUpdating(null);
    }
  };

  const grantAllToUser = async (userId: string) => {
    setUpdating(`all-${userId}`);

    const appIds = apps.filter((a) => a.is_active).map((a) => a.id);

    try {
      const res = await fetch('/api/access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, app_ids: appIds }),
      });

      if (res.ok) {
        setAccessMap((prev) => ({
          ...prev,
          [userId]: appIds,
        }));
      }
    } catch (error) {
      console.error('Failed to grant all access:', error);
    } finally {
      setUpdating(null);
    }
  };

  const revokeAllFromUser = async (userId: string) => {
    setUpdating(`all-${userId}`);

    try {
      const res = await fetch('/api/access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, app_ids: [] }),
      });

      if (res.ok) {
        setAccessMap((prev) => ({
          ...prev,
          [userId]: [],
        }));
      }
    } catch (error) {
      console.error('Failed to revoke all access:', error);
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                         user.name?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesActive = showInactiveUsers || user.is_active === 1;
    return matchesSearch && matchesActive;
  });

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(appSearch.toLowerCase()) ||
                         app.slug.toLowerCase().includes(appSearch.toLowerCase());
    const matchesActive = showInactiveApps || app.is_active === 1;
    return matchesSearch && matchesActive;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Access Matrix</h1>
          <p className="text-muted-foreground">Manage user access to applications</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <AppWindow className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">No Applications</h3>
          <p className="text-muted-foreground">Add some applications first to manage access</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Access Matrix</h1>
        <p className="text-muted-foreground">Manage user access to applications</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <Search className="h-4 w-4" />
            Search Users
          </label>
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search by username or name..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="block w-full rounded-lg border border-border bg-input px-3 py-2 pr-8 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {userSearch && (
              <button
                onClick={() => setUserSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showInactiveUsers}
              onChange={(e) => setShowInactiveUsers(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
            />
            Show inactive users
          </label>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <Search className="h-4 w-4" />
            Search Applications
          </label>
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search by name or slug..."
              value={appSearch}
              onChange={(e) => setAppSearch(e.target.value)}
              className="block w-full rounded-lg border border-border bg-input px-3 py-2 pr-8 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {appSearch && (
              <button
                onClick={() => setAppSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showInactiveApps}
              onChange={(e) => setShowInactiveApps(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
            />
            Show inactive apps
          </label>
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users and {filteredApps.length} of {apps.length} apps
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="sticky left-0 z-10 bg-card px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    User
                  </div>
                </th>
                {filteredApps.map((app) => (
                  <th
                    key={app.id}
                    className={`px-4 py-4 text-center text-sm font-medium ${
                      app.is_active ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{app.name}</span>
                      {!app.is_active && (
                        <span className="text-xs text-muted-foreground">(inactive)</span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-4 text-center text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={filteredApps.length + 2} className="px-6 py-8 text-center text-muted-foreground">
                    No users found matching your search criteria
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="sticky left-0 z-10 bg-card px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className={`font-medium ${user.is_active ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.is_admin ? 'Admin' : 'User'}
                            {!user.is_active && ' • Inactive'}
                          </p>
                        </div>
                      </div>
                    </td>
                    {filteredApps.map((app) => {
                    const hasAccess = accessMap[user.id]?.includes(app.id);
                    const isUpdating = updating === `${user.id}-${app.id}`;

                    return (
                      <td key={app.id} className="px-4 py-4 text-center">
                        <button
                          onClick={() => toggleAccess(user.id, app.id)}
                          disabled={isUpdating || !app.is_active}
                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                            isUpdating
                              ? 'cursor-wait opacity-50'
                              : !app.is_active
                              ? 'cursor-not-allowed opacity-30'
                              : hasAccess
                              ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {hasAccess ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => grantAllToUser(user.id)}
                        disabled={updating === `all-${user.id}`}
                        className="rounded-lg bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 transition-colors hover:bg-green-500/20 disabled:cursor-wait disabled:opacity-50"
                      >
                        Grant All
                      </button>
                      <button
                        onClick={() => revokeAllFromUser(user.id)}
                        disabled={updating === `all-${user.id}`}
                        className="rounded-lg bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-50"
                      >
                        Revoke All
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-green-500/20">
            <Check className="h-3 w-3 text-green-500" />
          </div>
          <span>Has Access</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
            <X className="h-3 w-3 text-muted-foreground" />
          </div>
          <span>No Access</span>
        </div>
      </div>
    </div>
  );
}
