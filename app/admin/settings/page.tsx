'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Server, Key } from 'lucide-react';

export default function SettingsPage() {
  const [nexusHost, setNexusHost] = useState('');
  const [nexusPort, setNexusPort] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setNexusHost(data.settings?.nexus_host || '');
      setNexusPort(data.settings?.nexus_port || '');
    } catch (error) {
      console.error('Failed to fetch settings:', error);
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
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nexus_host: nexusHost,
          nexus_port: nexusPort,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save settings');
        return;
      }

      setSuccess('Settings saved successfully');
    } catch {
      setError('Failed to save settings');
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure NEXUS system settings</p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Server Configuration */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Server Configuration</h2>
              <p className="text-sm text-muted-foreground">
                Configure the NEXUS server hostname and port
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Server Host / IP
              </label>
              <input
                type="text"
                value={nexusHost}
                onChange={(e) => setNexusHost(e.target.value)}
                className="block w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="192.168.1.100 or server.local"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The hostname or IP address where NEXUS is accessible
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Server Port
              </label>
              <input
                type="text"
                value={nexusPort}
                onChange={(e) => setNexusPort(e.target.value)}
                className="block w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="4000"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The port NEXUS runs on (default: 4000)
              </p>
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

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* Security Info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
              <Key className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Security</h2>
              <p className="text-sm text-muted-foreground">
                Security settings are configured via environment variables
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-lg bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">JWT Secret</p>
              <p className="text-sm text-muted-foreground">
                Set via <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NEXUS_JWT_SECRET</code> environment variable
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Token Expiry</p>
              <p className="text-sm text-muted-foreground">
                Set via <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NEXUS_TOKEN_EXPIRY</code> (default: 24h)
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Important: Make sure to set a strong JWT secret in production. The same secret must be configured in all client applications.
          </p>
        </div>

        {/* Client App Configuration */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
              <Settings className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Client App Configuration</h2>
              <p className="text-sm text-muted-foreground">
                Environment variables required for client applications
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-4">
            <pre className="overflow-x-auto text-sm text-foreground">
{`# Add to each client app's .env file
NEXUS_URL=http://${nexusHost || '<server-ip>'}:${nexusPort || '4000'}
NEXUS_JWT_SECRET=<same-secret-as-nexus>
APP_SLUG=<app-slug-from-nexus>`}
            </pre>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Each client application needs these environment variables to integrate with NEXUS authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
