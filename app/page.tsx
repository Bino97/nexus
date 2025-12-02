import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { Application } from '@/lib/types';
import Link from 'next/link';
import { Shield, Settings, LogOut } from 'lucide-react';
import DashboardWrapper from '@/components/dashboard/DashboardWrapper';

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.mustChangePassword) {
    redirect('/change-password');
  }

  const userApps = db.prepare(`
    SELECT a.*
    FROM applications a
    INNER JOIN user_app_access ua ON a.id = ua.app_id
    WHERE ua.user_id = ? AND a.is_active = 1
    ORDER BY a.sort_order, a.name
  `).all(session.id) as Application[];

  return (
    <div className="min-h-screen bg-background">
      {userApps.length === 0 ? (
        <>
          <header className="border-b border-border bg-card">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">NEXUS</h1>
                  <p className="text-xs text-muted-foreground">Application Hub</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {session.isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <Settings className="h-4 w-4" />
                    Admin
                  </Link>
                )}

                <LogoutButton />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-6 py-12">
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">No Applications Available</h3>
              <p className="text-muted-foreground">
                You don&apos;t have access to any applications yet.
                <br />
                Contact your administrator to request access.
              </p>
            </div>
          </main>
        </>
      ) : (
        <DashboardWrapper
          initialApps={userApps}
          userName={session.name || session.username}
          isAdmin={session.isAdmin}
        />
      )}
    </div>
  );
}

function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </form>
  );
}
