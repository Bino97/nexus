'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, XCircle, ArrowLeft } from 'lucide-react';

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const app = searchParams.get('app');
  const [branding, setBranding] = useState({
    site_name: 'NEXUS',
    site_tagline: 'Application Hub',
    logo_url: null as string | null,
    primary_color: '#3b82f6',
  });

  useEffect(() => {
    fetch('/api/branding')
      .then((res) => res.json())
      .then((data) => setBranding(data))
      .catch((err) => console.error('Failed to load branding:', err));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${branding.primary_color}15` }}
          >
            <XCircle className="h-8 w-8" style={{ color: branding.primary_color }} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Access Denied</h1>
        </div>

        {/* Message */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6">
            <p className="text-lg text-card-foreground">
              You don&apos;t have permission to access{' '}
              {app ? (
                <span className="font-semibold text-primary">{app}</span>
              ) : (
                'this application'
              )}
              .
            </p>
            <p className="mt-3 text-muted-foreground">
              Contact your {branding.site_name} administrator to request access.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium text-white transition-opacity"
              style={{
                backgroundColor: branding.primary_color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </Link>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 font-medium text-card-foreground transition-colors hover:bg-secondary"
            >
              <Shield className="h-4 w-4" />
              Sign in with different account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  );
}
