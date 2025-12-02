'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Eye, EyeOff, Save } from 'lucide-react';

interface UserData {
  id: string;
  username: string;
  name: string | null;
  is_admin: number;
  is_active: number;
  must_change_password: number;
  created_at: number;
  last_login_at: number | null;
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<UserData | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/users/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch user');
        setLoading(false);
        return;
      }

      setUser(data.user);
      setName(data.user.name || '');
      setIsAdmin(data.user.is_admin === 1);
      setIsActive(data.user.is_active === 1);
      setMustChangePassword(data.user.must_change_password === 1);
    } catch {
      setError('Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const updates: Record<string, unknown> = {
      name: name || null,
      is_admin: isAdmin,
      is_active: isActive,
      must_change_password: mustChangePassword,
    };

    if (password) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setSaving(false);
        return;
      }
      updates.password = password;
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update user');
        setSaving(false);
        return;
      }

      setSuccess('User updated successfully');
      setPassword('');
      fetchUser();
    } catch {
      setError('Failed to update user');
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

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-destructive">{error || 'User not found'}</p>
        <Link href="/admin/users" className="mt-4 text-primary hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Edit User</h1>
        <p className="text-muted-foreground">Update user account settings</p>
      </div>

      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{user.username}</h2>
              <p className="text-sm text-muted-foreground">
                Created {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Username
              </label>
              <input
                type="text"
                value={user.username}
                disabled
                className="block w-full rounded-lg border border-border bg-muted px-4 py-3 text-muted-foreground"
              />
              <p className="mt-1 text-xs text-muted-foreground">Username cannot be changed</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter display name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Reset Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-border bg-input px-4 py-3 pr-10 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Leave blank to keep current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isAdmin" className="text-sm">
                  <span className="font-medium text-foreground">Administrator</span>
                  <p className="text-muted-foreground">Can manage users, apps, and access</p>
                </label>
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
                  <p className="text-muted-foreground">User can log in and access apps</p>
                </label>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
                <input
                  type="checkbox"
                  id="mustChangePassword"
                  checked={mustChangePassword}
                  onChange={(e) => setMustChangePassword(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="mustChangePassword" className="text-sm">
                  <span className="font-medium text-foreground">Require Password Change</span>
                  <p className="text-muted-foreground">User must change password on next login</p>
                </label>
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
                href="/admin/users"
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
