'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppWindow, Plus, Search, Pencil, Trash2, Check, X, ExternalLink } from 'lucide-react';

interface App {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_url: string;
  icon: string | null;
  color: string | null;
  is_active: number;
  sort_order: number;
  created_at: number;
}

export default function AppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      const data = await res.json();
      setApps(data.apps || []);
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/apps/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setApps(apps.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete app:', error);
    }
    setDeleteId(null);
  };

  const handleToggleActive = async (app: App) => {
    try {
      const res = await fetch(`/api/apps/${app.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !app.is_active }),
      });
      if (res.ok) {
        fetchApps();
      }
    } catch (error) {
      console.error('Failed to toggle app status:', error);
    }
  };

  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Applications</h1>
          <p className="text-muted-foreground">Manage registered applications</p>
        </div>
        <Link
          href="/admin/apps/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Application
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-lg border border-border bg-input pl-10 pr-4 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Apps Grid */}
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      ) : filteredApps.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <AppWindow className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">No Applications</h3>
          <p className="mb-4 text-muted-foreground">Get started by adding your first application</p>
          <Link
            href="/admin/apps/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Add Application
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className={`rounded-xl border bg-card p-5 transition-colors ${
                app.is_active ? 'border-border' : 'border-border/50 opacity-60'
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: app.color ? `${app.color}20` : '#3b82f620',
                  }}
                >
                  <AppWindow
                    className="h-6 w-6"
                    style={{ color: app.color || '#3b82f6' }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(app)}
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      app.is_active
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {app.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>

              <h3 className="mb-1 font-semibold text-foreground">{app.name}</h3>
              <p className="mb-2 text-xs text-muted-foreground">/{app.slug}</p>
              <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                {app.description || 'No description'}
              </p>

              <a
                href={app.base_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {app.base_url}
                <ExternalLink className="h-3 w-3" />
              </a>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <Link
                  href={`/admin/apps/${app.id}`}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                {deleteId === app.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="rounded-lg bg-destructive p-2 text-destructive-foreground"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(null)}
                      className="rounded-lg bg-secondary p-2 text-secondary-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteId(app.id)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
