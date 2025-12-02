'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Settings, LogOut, Search, Settings2, Menu, X } from 'lucide-react';

interface DashboardHeaderProps {
  isAdmin: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showCustomizer: boolean;
  onToggleCustomizer: () => void;
  accentColor: string;
  cardOpacity: number;
}

export default function DashboardHeader({
  isAdmin,
  searchQuery,
  onSearchChange,
  showCustomizer,
  onToggleCustomizer,
  accentColor,
  cardOpacity,
}: DashboardHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <header
      className="relative border-b border-border bg-card"
      style={{
        zIndex: 10,
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accentColor}10` }}
          >
            {branding.logo_url ? (
              <img src={branding.logo_url} alt="Logo" className="h-6 w-6 object-contain" />
            ) : (
              <Shield className="h-5 w-5" style={{ color: accentColor }} />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{branding.site_name}</h1>
            <p className="text-xs text-muted-foreground">{branding.site_tagline}</p>
          </div>
        </div>

        {/* Centered Search Bar */}
        <div className="relative mx-auto flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Hamburger Menu Button */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center rounded-lg border p-2 transition-colors"
            style={{
              borderColor: isMenuOpen ? accentColor : 'hsl(var(--border))',
              color: isMenuOpen ? accentColor : 'hsl(var(--muted-foreground))',
            }}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-card shadow-xl">
                <div className="p-2">
                  {/* Customize Button */}
                  <button
                    onClick={() => {
                      onToggleCustomizer();
                      setIsMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                      showCustomizer
                        ? ''
                        : 'text-foreground hover:bg-secondary'
                    }`}
                    style={
                      showCustomizer
                        ? {
                            backgroundColor: `${accentColor}10`,
                            color: accentColor,
                          }
                        : undefined
                    }
                  >
                    <Settings2 className="h-4 w-4" />
                    <span>Customize</span>
                  </button>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  )}

                  <div className="my-1 border-t border-border" />

                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
