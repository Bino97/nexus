'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AppWindow, Save } from 'lucide-react';

interface AppData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_url: string;
  icon: string | null;
  color: string | null;
  is_active: number;
  sort_order: number;
  uses_nexus_auth: number;
  created_at: number;
}

const iconOptions = [
  'shield', 'database', 'search', 'users', 'settings', 'monitor',
  'globe', 'lock', 'eye', 'file-text', 'folder', 'image',
  'message-circle', 'bell', 'calendar', 'clock', 'map', 'camera',
  'phone', 'mail', 'link', 'bookmark', 'star', 'heart',
  'zap', 'cpu', 'server', 'cloud', 'wifi', 'bluetooth',
];

const colorOptions = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#6366f1',
];

export default function EditAppPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [app, setApp] = useState<AppData | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [icon, setIcon] = useState('shield');
  const [color, setColor] = useState('#3b82f6');
  const [isActive, setIsActive] = useState(true);
  const [usesNexusAuth, setUsesNexusAuth] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchApp();
  }, [id]);

  const fetchApp = async () => {
    try {
      const res = await fetch(`/api/apps/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch application');
        setLoading(false);
        return;
      }

      setApp(data.app);
      setName(data.app.name);
      setSlug(data.app.slug);
      setDescription(data.app.description || '');
      setBaseUrl(data.app.base_url);
      setIcon(data.app.icon || 'shield');
      setColor(data.app.color || '#3b82f6');
      setIsActive(data.app.is_active === 1);
      setUsesNexusAuth(data.app.uses_nexus_auth === 1);
    } catch {
      setError('Failed to fetch application');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          base_url: baseUrl,
          icon,
          color,
          is_active: isActive,
          uses_nexus_auth: usesNexusAuth,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update application');
        setSaving(false);
        return;
      }

      setSuccess('Application updated successfully');
      fetchApp();
    } catch {
      setError('Failed to update application');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center">
        <p className="text-destructive">{error || 'Application not found'}</p>
        <Link href="/admin/apps" className="mt-4 text-primary hover:underline">
          Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/apps"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Edit Application</h1>
        <p className="text-muted-foreground">Update application settings</p>
      </div>

      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}20` }}
            >
              <AppWindow className="h-6 w-6" style={{ color }} />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{app.name}</h2>
              <p className="text-sm text-muted-foreground">
                Created {new Date(app.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="block w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Slug <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
                className="block w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Base URL <span className="text-destructive">*</span>
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                required
                className="block w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="block w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`rounded-lg border p-2 transition-colors ${
                      icon === i
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <span className="text-xs">{i}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-lg border-2 transition-all ${
                      color === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm">
                <span className="font-medium text-foreground">Active</span>
                <p className="text-muted-foreground">Application is available to users</p>
              </label>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <input
                type="checkbox"
                id="usesNexusAuth"
                checked={usesNexusAuth}
                onChange={(e) => setUsesNexusAuth(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex-1">
                <label htmlFor="usesNexusAuth" className="block cursor-pointer font-medium text-foreground">
                  Uses NEXUS Authentication
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enable this if the application integrates with NEXUS authentication middleware.
                  When enabled, this app will appear in the Access Matrix for permission management.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-500">
                {success}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/admin/apps"
                className="rounded-lg border border-border bg-card px-4 py-3 font-medium text-card-foreground transition-colors hover:bg-secondary"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
