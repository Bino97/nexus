'use client';

import { useState } from 'react';
import { Book, Code, Shield, Check, Layers } from 'lucide-react';
import { FrameworkSelector } from './FrameworkSelector';
import { LanguageTabs } from './LanguageTabs';

export function DocsContent() {
  const [activeFramework, setActiveFramework] = useState('nextjs');

  const middlewareExamples = {
    nextjs: {
      label: 'Next.js',
      code: `import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

const NEXUS_URL = process.env.NEXUS_URL || 'http://localhost:4000';
const APP_SLUG = process.env.NEXUS_APP_SLUG || 'your-app';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('nexus_token')?.value;

  // Allow health check endpoint
  if (request.nextUrl.pathname === '/api/nexus/health') {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL(\`/login\`, NEXUS_URL);
    loginUrl.searchParams.set('redirect', request.url);
    loginUrl.searchParams.set('app', APP_SLUG);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    if (!payload.apps?.includes(APP_SLUG)) {
      return new NextResponse('Access Denied', { status: 403 });
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub as string);
    requestHeaders.set('x-username', payload.username as string);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (error) {
    const loginUrl = new URL(\`/login\`, NEXUS_URL);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};`,
    },
    express: {
      label: 'Express',
      code: `const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());

const NEXUS_URL = process.env.NEXUS_URL || 'http://localhost:4000';
const APP_SLUG = process.env.NEXUS_APP_SLUG || 'your-app';
const JWT_SECRET = process.env.JWT_SECRET;

// Health check bypass
app.get('/api/nexus/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth middleware
app.use((req, res, next) => {
  const token = req.cookies.nexus_token;

  if (!token) {
    return res.redirect(
      \`\${NEXUS_URL}/login?redirect=\${encodeURIComponent(req.originalUrl)}&app=\${APP_SLUG}\`
    );
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (!payload.apps?.includes(APP_SLUG)) {
      return res.status(403).send('Access Denied');
    }

    req.user = {
      id: payload.sub,
      username: payload.username,
      isAdmin: payload.isAdmin,
    };

    next();
  } catch (err) {
    res.redirect(\`\${NEXUS_URL}/login?app=\${APP_SLUG}\`);
  }
});`,
    },
    flask: {
      label: 'Flask (Python)',
      code: `from flask import Flask, request, redirect, g
import jwt
import os

app = Flask(__name__)

NEXUS_URL = os.getenv('NEXUS_URL', 'http://localhost:4000')
APP_SLUG = os.getenv('NEXUS_APP_SLUG', 'your-app')
JWT_SECRET = os.getenv('JWT_SECRET')

@app.route('/api/nexus/health')
def health_check():
    return {'status': 'ok', 'timestamp': datetime.now().isoformat()}

@app.before_request
def verify_nexus_auth():
    # Skip auth for health check
    if request.path == '/api/nexus/health':
        return None

    token = request.cookies.get('nexus_token')

    if not token:
        redirect_url = f"{NEXUS_URL}/login?redirect={request.url}&app={APP_SLUG}"
        return redirect(redirect_url)

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])

        if APP_SLUG not in payload.get('apps', []):
            return 'Access Denied', 403

        g.user = {
            'id': payload['sub'],
            'username': payload['username'],
            'isAdmin': payload.get('isAdmin', False)
        }

    except jwt.InvalidTokenError:
        return redirect(f"{NEXUS_URL}/login?app={APP_SLUG}")`,
    },
    go: {
      label: 'Go',
      code: `package main

import (
    "net/http"
    "os"
    "github.com/golang-jwt/jwt/v5"
)

var (
    NexusURL  = getEnv("NEXUS_URL", "http://localhost:4000")
    AppSlug   = getEnv("NEXUS_APP_SLUG", "your-app")
    JWTSecret = []byte(os.Getenv("JWT_SECRET"))
)

func authMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Skip auth for health check
        if r.URL.Path == "/api/nexus/health" {
            next.ServeHTTP(w, r)
            return
        }

        cookie, err := r.Cookie("nexus_token")
        if err != nil {
            redirectURL := fmt.Sprintf("%s/login?redirect=%s&app=%s",
                NexusURL, r.URL.String(), AppSlug)
            http.Redirect(w, r, redirectURL, http.StatusFound)
            return
        }

        token, err := jwt.Parse(cookie.Value, func(token *jwt.Token) (interface{}, error) {
            return JWTSecret, nil
        })

        if err != nil || !token.Valid {
            http.Redirect(w, r, NexusURL+"/login", http.StatusFound)
            return
        }

        claims := token.Claims.(jwt.MapClaims)
        apps := claims["apps"].([]interface{})

        hasAccess := false
        for _, app := range apps {
            if app.(string) == AppSlug {
                hasAccess = true
                break
            }
        }

        if !hasAccess {
            http.Error(w, "Access Denied", http.StatusForbidden)
            return
        }

        next.ServeHTTP(w, r)
    })
}`,
    },
  };

  const healthCheckExamples = {
    nextjs: {
      label: 'Next.js',
      code: `import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  const headersList = headers();
  const userAgent = headersList.get('user-agent');

  if (userAgent && !userAgent.includes('NEXUS-Health-Check')) {
    return NextResponse.json({ status: 'ok' });
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    app: process.env.NEXUS_APP_SLUG || 'unknown',
  });
}`,
    },
    express: {
      label: 'Express',
      code: `app.get('/api/nexus/health', (req, res) => {
  const userAgent = req.get('user-agent');

  if (userAgent && !userAgent.includes('NEXUS-Health-Check')) {
    return res.json({ status: 'ok' });
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    app: process.env.NEXUS_APP_SLUG || 'unknown',
  });
});`,
    },
    flask: {
      label: 'Flask (Python)',
      code: `from flask import request, jsonify
from datetime import datetime

@app.route('/api/nexus/health')
def health_check():
    user_agent = request.headers.get('User-Agent', '')

    if 'NEXUS-Health-Check' not in user_agent:
        return jsonify({'status': 'ok'})

    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'app': os.getenv('NEXUS_APP_SLUG', 'unknown')
    })`,
    },
    go: {
      label: 'Go',
      code: `func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
    userAgent := r.Header.Get("User-Agent")

    if !strings.Contains(userAgent, "NEXUS-Health-Check") {
        json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
        return
    }

    response := map[string]string{
        "status":    "ok",
        "timestamp": time.Now().Format(time.RFC3339),
        "app":       getEnv("NEXUS_APP_SLUG", "unknown"),
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}`,
    },
  };

  return (
    <>
      {/* Overview */}
      <section className="mb-12">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Welcome to NEXUS Integration Documentation</h2>
          <p className="mb-4 text-foreground">
            NEXUS provides a centralized authentication system that works with any web framework. This documentation covers:
          </p>
          <ul className="space-y-2 text-foreground">
            <li className="flex items-start gap-2">
              <Check className="mt-1 h-4 w-4 shrink-0 text-green-500" />
              <span>How to integrate NEXUS authentication with Next.js, Express, Flask, and Go applications</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-1 h-4 w-4 shrink-0 text-green-500" />
              <span>Implementing health check endpoints for real-time status monitoring</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-1 h-4 w-4 shrink-0 text-green-500" />
              <span>Customizing your NEXUS instance with site-wide branding and user preferences</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Framework Support */}
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Framework Support</h2>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-foreground">
            NEXUS authentication works with any web framework through standard JWT tokens and HTTP cookies.
            Select your framework to see specific implementation examples:
          </p>

          <FrameworkSelector activeFramework={activeFramework} onFrameworkChange={setActiveFramework} />

          <div className="mt-4 rounded bg-blue-500/10 p-4">
            <p className="text-sm text-blue-500">
              <strong>How it works:</strong> NEXUS stores a JWT token in the{' '}
              <code className="rounded bg-blue-500/20 px-1">nexus_token</code> cookie. Your app verifies this token
              using the shared JWT secret to authenticate users.
            </p>
          </div>
        </div>
      </section>

      {/* Authentication Middleware */}
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Authentication Middleware</h2>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-foreground">
            Implement authentication middleware to verify NEXUS tokens and protect your application routes:
          </p>

          <LanguageTabs examples={middlewareExamples} activeTab={activeFramework} onTabChange={setActiveFramework} />
        </div>
      </section>

      {/* Health Check Endpoint */}
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2">
          <Check className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Health Check Endpoint</h2>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-foreground">
            Create a <code className="rounded bg-secondary px-2 py-1 text-sm">/api/nexus/health</code> endpoint that
            NEXUS can ping to monitor your application status:
          </p>

          <LanguageTabs examples={healthCheckExamples} activeTab={activeFramework} onTabChange={setActiveFramework} />

          <div className="mt-4 space-y-3">
            <div className="rounded bg-blue-500/10 p-4">
              <p className="text-sm text-blue-500">
                <strong>Tip:</strong> NEXUS pings this endpoint when users load the dashboard to check your app status
                and display it in real-time.
              </p>
            </div>
            <div className="rounded bg-yellow-500/10 p-4">
              <p className="text-sm text-yellow-600">
                <strong>Security Note:</strong> This endpoint is unauthenticated by design. For production, consider
                adding rate limiting or IP whitelisting to prevent abuse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Configuration Checklist */}
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2">
          <Book className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Configuration Checklist</h2>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/10">
              <Check className="h-3 w-3 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Application created in NEXUS</p>
              <p className="text-sm text-muted-foreground">Add your app in NEXUS Admin → Applications</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/10">
              <Check className="h-3 w-3 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Environment variables configured</p>
              <p className="text-sm text-muted-foreground">
                Set NEXUS_URL, NEXUS_APP_SLUG, JWT_SECRET in your environment
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/10">
              <Check className="h-3 w-3 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Authentication middleware implemented</p>
              <p className="text-sm text-muted-foreground">Add middleware to protect your routes</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/10">
              <Check className="h-3 w-3 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Health check endpoint added</p>
              <p className="text-sm text-muted-foreground">Create /api/nexus/health endpoint</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/10">
              <Check className="h-3 w-3 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Users granted access</p>
              <p className="text-sm text-muted-foreground">Assign users to your app in NEXUS</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/10">
              <Check className="h-3 w-3 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">JWT_SECRET matches NEXUS</p>
              <p className="text-sm text-muted-foreground">
                Use the same JWT secret as your NEXUS installation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Branding & Customization */}
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2">
          <Code className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Branding & Customization</h2>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-6">
          <div>
            <h3 className="mb-2 font-semibold text-foreground">Site-Wide Branding</h3>
            <p className="mb-2 text-sm text-foreground">
              Administrators can customize the NEXUS instance branding from the <strong>Admin → Branding</strong> page:
            </p>
            <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
              <li><strong>Site Name:</strong> Replace "NEXUS" with your organization's name</li>
              <li><strong>Site Tagline:</strong> Customize the tagline displayed on login and dashboard</li>
              <li><strong>Logo URL:</strong> Provide a URL to your organization's logo (optional)</li>
              <li><strong>Primary Color:</strong> Set a custom primary color for buttons and accents throughout the site</li>
            </ul>
            <div className="mt-3 rounded bg-blue-500/10 p-3">
              <p className="text-sm text-blue-500">
                <strong>Tip:</strong> Use the live preview tabs to see how your branding will appear on the login page,
                password reset page, unauthorized page, and dashboard header before saving.
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-foreground">User Dashboard Customization</h3>
            <p className="mb-2 text-sm text-foreground">
              Users can personalize their dashboard experience using the <strong>Customize</strong> menu:
            </p>
            <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
              <li><strong>View Modes:</strong> Choose between compact grid, comfortable grid, or list view</li>
              <li><strong>Accent Colors:</strong> Select from 8 preset colors (Blue, Purple, Green, Orange, Pink, Red, Teal, Indigo)</li>
              <li><strong>Card Opacity:</strong> Adjust app card transparency from 0-100%</li>
              <li><strong>Background Images:</strong> Set custom background images via URL</li>
              <li><strong>Favorites:</strong> Star frequently used apps and filter to show only favorites</li>
              <li><strong>App Ordering:</strong> Drag and drop apps to reorder them</li>
            </ul>
            <div className="mt-3 rounded bg-green-500/10 p-3">
              <p className="text-sm text-green-600">
                <strong>Note:</strong> All user preferences are automatically saved per-user and persist across sessions.
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-foreground">Default Branding</h3>
            <p className="text-sm text-muted-foreground">
              NEXUS defaults to the following branding values if not customized:
            </p>
            <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
              <li>Site Name: <code className="rounded bg-secondary px-1">NEXUS</code></li>
              <li>Site Tagline: <code className="rounded bg-secondary px-1">Application Hub</code></li>
              <li>Logo: Default shield icon</li>
              <li>Primary Color: <code className="rounded bg-secondary px-1">#3b82f6</code> (Blue)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-foreground">Troubleshooting</h2>

        <div className="space-y-4 rounded-lg border border-border bg-card p-6">
          <div>
            <h3 className="mb-2 font-semibold text-foreground">Redirect Loop</h3>
            <p className="text-sm text-muted-foreground">
              Make sure your middleware excludes static files and the health check endpoint. Check that JWT_SECRET
              matches between NEXUS and your app.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-foreground">403 Access Denied</h3>
            <p className="text-sm text-muted-foreground">
              User doesn't have access to this app. Grant access in NEXUS Admin → Users → Edit User → Applications.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-foreground">Health Check Offline</h3>
            <p className="text-sm text-muted-foreground">
              Ensure /api/nexus/health is excluded from middleware authentication and returns a 200 OK response.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-foreground">Token Verification Fails</h3>
            <p className="text-sm text-muted-foreground">
              Verify that JWT_SECRET is identical in both NEXUS and your application. The secret must be exactly the
              same string for token verification to work.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
