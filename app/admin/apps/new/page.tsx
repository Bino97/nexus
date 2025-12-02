'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AppWindow } from 'lucide-react';

// Common Lucide icon names for selection
const iconOptions = [
  'shield', 'database', 'search', 'users', 'settings', 'monitor',
  'globe', 'lock', 'eye', 'file-text', 'folder', 'image',
  'message-circle', 'bell', 'calendar', 'clock', 'map', 'camera',
  'phone', 'mail', 'link', 'bookmark', 'star', 'heart',
  'zap', 'cpu', 'server', 'cloud', 'wifi', 'bluetooth',
];

const colorOptions = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#6366f1', // indigo
];

export default function NewAppPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [icon, setIcon] = useState('shield');
  const [color, setColor] = useState('#3b82f6');
  const [usesNexusAuth, setUsesNexusAuth] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description: description || undefined,
          base_url: baseUrl,
          icon,
          color,
          uses_nexus_auth: usesNexusAuth,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create application');
        setLoading(false);
        return;
      }

      router.push('/admin/apps');
    } catch {
      setError('Failed to create application');
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-foreground">Add Application</h1>
        <p className="text-muted-foreground">Register a new application</p>
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
              <h2 className="font-semibold text-foreground">Application Details</h2>
              <p className="text-sm text-muted-foreground">Configure the application settings</p>
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
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="block w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="My Application"
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
                pattern="[a-z0-9-]+"
                className="block w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="my-application"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Unique identifier (lowercase, hyphens only)
              </p>
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
                className="block w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="http://192.168.1.100:3000"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Full URL including port (use server IP, not localhost)
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="block w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Brief description of the application"
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
                    title={i}
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

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Application'}
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
