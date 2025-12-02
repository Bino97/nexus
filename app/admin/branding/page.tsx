'use client';

import { useState, useEffect } from 'react';
import { Save, Palette, Type, Image as ImageIcon, Shield, LogIn, Key, XCircle } from 'lucide-react';
import Link from 'next/link';

interface BrandingSettings {
  site_name: string;
  site_tagline: string;
  logo_url: string | null;
  primary_color: string;
}

type PreviewTab = 'header' | 'login' | 'reset' | 'unauthorized';

export default function BrandingPage() {
  const [branding, setBranding] = useState<BrandingSettings>({
    site_name: 'NEXUS',
    site_tagline: 'Application Hub',
    logo_url: null,
    primary_color: '#3b82f6',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activePreview, setActivePreview] = useState<PreviewTab>('header');

  useEffect(() => {
    fetch('/api/branding')
      .then((res) => res.json())
      .then((data) => {
        setBranding(data);
      })
      .catch((err) => {
        console.error('Failed to load branding:', err);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Branding settings saved successfully! Refresh to see changes.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save branding settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save branding settings' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Branding Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize the appearance of your NEXUS instance across all pages
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100'
              : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Settings Form */}
      <div className="rounded-lg border border-border bg-card">
        <div className="space-y-6 p-6">
          {/* Site Name */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Type className="h-4 w-4" />
              Site Name
            </label>
            <input
              type="text"
              value={branding.site_name}
              onChange={(e) => setBranding({ ...branding, site_name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
              placeholder="NEXUS"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The main name displayed in headers and login pages
            </p>
          </div>

          {/* Site Tagline */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Type className="h-4 w-4" />
              Site Tagline
            </label>
            <input
              type="text"
              value={branding.site_tagline}
              onChange={(e) => setBranding({ ...branding, site_tagline: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
              placeholder="Application Hub"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              A short description shown below the site name
            </p>
          </div>

          {/* Logo URL */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <ImageIcon className="h-4 w-4" />
              Logo URL (optional)
            </label>
            <input
              type="text"
              value={branding.logo_url || ''}
              onChange={(e) => setBranding({ ...branding, logo_url: e.target.value || null })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
              placeholder="https://example.com/logo.png"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              URL to your organization's logo. Leave empty to use the default shield icon.
            </p>
            {branding.logo_url && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Logo Preview:</p>
                <img
                  src={branding.logo_url}
                  alt="Logo preview"
                  className="h-16 w-16 rounded-lg border border-border object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Primary Color */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Palette className="h-4 w-4" />
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.primary_color}
                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                className="h-10 w-20 cursor-pointer rounded border border-border"
              />
              <input
                type="text"
                value={branding.primary_color}
                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                placeholder="#3b82f6"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              The primary accent color used throughout the site
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
          <Link
            href="/admin"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to Admin
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Preview</h2>

        {/* Preview Tabs */}
        <div className="mb-4 flex gap-2 border-b border-border">
          <button
            onClick={() => setActivePreview('header')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activePreview === 'header'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="h-4 w-4" />
            Header
          </button>
          <button
            onClick={() => setActivePreview('login')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activePreview === 'login'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <LogIn className="h-4 w-4" />
            Login Page
          </button>
          <button
            onClick={() => setActivePreview('reset')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activePreview === 'reset'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Key className="h-4 w-4" />
            Password Reset
          </button>
          <button
            onClick={() => setActivePreview('unauthorized')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activePreview === 'unauthorized'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <XCircle className="h-4 w-4" />
            Unauthorized
          </button>
        </div>

        {/* Preview Content */}
        <div className="rounded-lg border border-border bg-background p-8">
          {activePreview === 'header' && (
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${branding.primary_color}15` }}
              >
                {branding.logo_url ? (
                  <img
                    src={branding.logo_url}
                    alt="Logo"
                    className="h-8 w-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={branding.primary_color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{branding.site_name}</h1>
                <p className="text-sm text-muted-foreground">{branding.site_tagline}</p>
              </div>
            </div>
          )}

          {activePreview === 'login' && (
            <div className="mx-auto max-w-md space-y-6">
              <div className="text-center">
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${branding.primary_color}15` }}
                >
                  {branding.logo_url ? (
                    <img src={branding.logo_url} alt="Logo" className="h-10 w-10 object-contain" />
                  ) : (
                    <Shield className="h-10 w-10" style={{ color: branding.primary_color }} />
                  )}
                </div>
                <h1 className="text-3xl font-bold text-foreground">{branding.site_name}</h1>
                <p className="mt-2 text-muted-foreground">{branding.site_tagline}</p>
              </div>
              <div className="space-y-4 rounded-lg border border-border bg-card p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Username</label>
                  <input
                    type="text"
                    disabled
                    placeholder="username"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                  <input
                    type="password"
                    disabled
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <button
                  disabled
                  className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: branding.primary_color }}
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {activePreview === 'reset' && (
            <div className="mx-auto max-w-md space-y-6">
              <div className="text-center">
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${branding.primary_color}15` }}
                >
                  <Key className="h-8 w-8" style={{ color: branding.primary_color }} />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your new password for {branding.site_name}
                </p>
              </div>
              <div className="space-y-4 rounded-lg border border-border bg-card p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">New Password</label>
                  <input
                    type="password"
                    disabled
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm Password</label>
                  <input
                    type="password"
                    disabled
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <button
                  disabled
                  className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: branding.primary_color }}
                >
                  Reset Password
                </button>
              </div>
            </div>
          )}

          {activePreview === 'unauthorized' && (
            <div className="mx-auto max-w-md text-center">
              <div
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: `${branding.primary_color}15` }}
              >
                <XCircle className="h-8 w-8" style={{ color: branding.primary_color }} />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-foreground">Access Denied</h1>
              <p className="mb-6 text-muted-foreground">
                You don't have permission to access this application. Please contact your {branding.site_name} administrator.
              </p>
              <button
                disabled
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: branding.primary_color }}
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
