'use client';

import { useState, useEffect } from 'react';
import { Application } from '@/lib/types';
import * as LucideIcons from 'lucide-react';
import {
  Shield,
  ExternalLink,
  Search,
  Grid3x3,
  LayoutList,
  Star,
  Settings2,
  Palette,
  Eye,
  EyeOff,
  GripVertical,
  Circle,
  Image,
  X,
} from 'lucide-react';

interface UserPreferences {
  view_mode: 'grid-compact' | 'grid-comfortable' | 'list';
  accent_color: string;
  show_url: boolean;
  app_order: string[] | null;
  favorite_apps: string[];
  background_url: string | null;
  card_opacity: number;
}

interface ModernDashboardProps {
  initialApps: Application[];
  userName: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showCustomizer: boolean;
  onToggleCustomizer: () => void;
  onAccentColorChange: (color: string) => void;
  onOpacityChange?: (opacity: number) => void;
}

const ACCENT_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
];

function AppIcon({ iconName, color }: { iconName: string | null; color?: string | null }) {
  const defaultColor = '#3b82f6';
  const iconColor = color || defaultColor;

  if (!iconName) {
    return <Shield className="h-6 w-6" style={{ color: iconColor }} />;
  }

  const pascalCase = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const Icon = (LucideIcons as any)[pascalCase];

  if (!Icon) {
    return <Shield className="h-6 w-6" style={{ color: iconColor }} />;
  }

  return <Icon className="h-6 w-6" style={{ color: iconColor }} />;
}

export default function ModernDashboard({
  initialApps,
  userName,
  searchQuery,
  onSearchChange,
  showCustomizer,
  onToggleCustomizer,
  onAccentColorChange,
  onOpacityChange
}: ModernDashboardProps) {
  const [apps, setApps] = useState<Application[]>(initialApps);
  const [filteredApps, setFilteredApps] = useState<Application[]>(initialApps);
  const [draggedApp, setDraggedApp] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<UserPreferences>({
    view_mode: 'grid-comfortable',
    accent_color: '#3b82f6',
    show_url: true,
    app_order: null,
    favorite_apps: [],
    background_url: null,
    card_opacity: 100,
  });

  // Load preferences
  useEffect(() => {
    fetch('/api/preferences')
      .then((res) => res.json())
      .then((data) => {
        const accentColor = data.accent_color || '#3b82f6';
        const cardOpacity = data.card_opacity !== undefined ? data.card_opacity : 100;

        setPreferences({
          view_mode: data.view_mode || 'grid-comfortable',
          accent_color: accentColor,
          show_url: data.show_url !== undefined ? data.show_url : true,
          app_order: data.app_order,
          favorite_apps: data.favorite_apps || [],
          background_url: data.background_url || null,
          card_opacity: cardOpacity,
        });

        // Notify parent of accent color and opacity
        onAccentColorChange(accentColor);
        if (onOpacityChange) {
          onOpacityChange(cardOpacity);
        }

        // Apply custom order if exists
        if (data.app_order && Array.isArray(data.app_order)) {
          const orderedApps = [...initialApps].sort((a, b) => {
            const indexA = data.app_order.indexOf(a.id);
            const indexB = data.app_order.indexOf(b.id);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
          setApps(orderedApps);
          setFilteredApps(orderedApps);
        }
      });
  }, [initialApps, onAccentColorChange, onOpacityChange]);

  // Apply accent color to CSS and notify parent
  useEffect(() => {
    document.documentElement.style.setProperty('--user-accent', preferences.accent_color);
    onAccentColorChange(preferences.accent_color);
  }, [preferences.accent_color, onAccentColorChange]);

  // Notify parent of opacity changes
  useEffect(() => {
    if (onOpacityChange) {
      onOpacityChange(preferences.card_opacity);
    }
  }, [preferences.card_opacity, onOpacityChange]);

  // Filter apps by search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredApps(apps);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredApps(
        apps.filter(
          (app) =>
            app.name.toLowerCase().includes(query) ||
            app.description?.toLowerCase().includes(query) ||
            app.base_url.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, apps]);

  const updatePreference = async (updates: Partial<UserPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);

    await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  };

  const toggleFavorite = (appId: string) => {
    const newFavorites = preferences.favorite_apps.includes(appId)
      ? preferences.favorite_apps.filter((id) => id !== appId)
      : [...preferences.favorite_apps, appId];

    updatePreference({ favorite_apps: newFavorites });
  };

  const handleDragStart = (appId: string) => {
    setDraggedApp(appId);
  };

  const handleDragOver = (e: React.DragEvent, targetAppId: string) => {
    e.preventDefault();
    if (!draggedApp || draggedApp === targetAppId) return;

    const newApps = [...apps];
    const draggedIndex = newApps.findIndex((app) => app.id === draggedApp);
    const targetIndex = newApps.findIndex((app) => app.id === targetAppId);

    const [removed] = newApps.splice(draggedIndex, 1);
    newApps.splice(targetIndex, 0, removed);

    setApps(newApps);
    setFilteredApps(newApps);
  };

  const handleDragEnd = () => {
    if (draggedApp) {
      const newOrder = apps.map((app) => app.id);
      updatePreference({ app_order: newOrder });
    }
    setDraggedApp(null);
  };

  const favoriteApps = filteredApps.filter((app) => preferences.favorite_apps.includes(app.id));
  const regularApps = filteredApps.filter((app) => !preferences.favorite_apps.includes(app.id));

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: preferences.background_url ? `url(${preferences.background_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background Overlay for readability */}
      {preferences.background_url && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" style={{ zIndex: 0 }} />
      )}

      {/* Content */}
      <div className="relative" style={{ zIndex: 1 }}>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex gap-6">
          {/* Customization Sidebar */}
          {showCustomizer && (
            <div className="w-64 shrink-0">
              <div
                className="sticky top-6 space-y-4 rounded-lg border border-border p-4"
                style={{ backgroundColor: `rgba(26, 26, 26, ${preferences.card_opacity / 100})` }}
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Palette className="h-4 w-4" />
                      View Settings
                    </h3>
                    <button
                      onClick={onToggleCustomizer}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      title="Close customizer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* View Mode */}
                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">Layout</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => updatePreference({ view_mode: 'grid-compact' })}
                        className={`flex flex-col items-center gap-1.5 rounded-md border p-2 transition-all ${
                          preferences.view_mode === 'grid-compact'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Grid3x3 className="h-4 w-4" />
                        <span className="text-xs">Compact</span>
                      </button>
                      <button
                        onClick={() => updatePreference({ view_mode: 'grid-comfortable' })}
                        className={`flex flex-col items-center gap-1.5 rounded-md border p-2 transition-all ${
                          preferences.view_mode === 'grid-comfortable'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Grid3x3 className="h-4 w-4" />
                        <span className="text-xs">Cozy</span>
                      </button>
                      <button
                        onClick={() => updatePreference({ view_mode: 'list' })}
                        className={`flex flex-col items-center gap-1.5 rounded-md border p-2 transition-all ${
                          preferences.view_mode === 'list'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <LayoutList className="h-4 w-4" />
                        <span className="text-xs">List</span>
                      </button>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">Accent Color</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {ACCENT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => updatePreference({ accent_color: color.value })}
                          className={`h-9 rounded-md border-2 transition-all ${
                            preferences.accent_color === color.value
                              ? 'scale-105 border-white shadow-md'
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Show URL Toggle */}
                  <div>
                    <button
                      onClick={() => updatePreference({ show_url: !preferences.show_url })}
                      className="flex w-full items-center justify-between rounded-md border border-border p-2.5 text-xs transition-all hover:border-primary/50"
                    >
                      <span className="font-medium">Show URLs</span>
                      {preferences.show_url ? (
                        <Eye className="h-4 w-4 text-primary" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {/* Background Image */}
                  <div className="mt-4 pt-3 border-t border-border">
                    <label className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Image className="h-3.5 w-3.5" />
                      Background Image
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={preferences.background_url || ''}
                          onChange={(e) => updatePreference({ background_url: e.target.value || null })}
                          placeholder="Enter image URL"
                          className="flex-1 rounded-md border border-border bg-input px-2.5 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                        {preferences.background_url && (
                          <button
                            onClick={() => updatePreference({ background_url: null })}
                            className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Remove background"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Supports images and GIFs
                      </p>
                    </div>

                    {/* Card Opacity Slider */}
                    <div className="mt-4">
                      <label className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>Card Opacity</span>
                        <span className="text-foreground">{preferences.card_opacity}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={preferences.card_opacity}
                        onChange={(e) => updatePreference({ card_opacity: parseInt(e.target.value) })}
                        className="w-full"
                        style={{
                          accentColor: preferences.accent_color,
                        }}
                      />
                      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                        <span>Transparent</span>
                        <span>Opaque</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Adjust transparency of cards
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    Drag to reorder. Star to favorite.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Apps Grid */}
          <div className="flex-1">
            {favoriteApps.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Star className="h-4 w-4" style={{ fill: preferences.accent_color, color: preferences.accent_color }} />
                  Favorites
                </h2>
                <AppGrid
                  apps={favoriteApps}
                  viewMode={preferences.view_mode}
                  showUrl={preferences.show_url}
                  accentColor={preferences.accent_color}
                  cardOpacity={preferences.card_opacity}
                  favoriteApps={preferences.favorite_apps}
                  onToggleFavorite={toggleFavorite}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                />
              </div>
            )}

            {regularApps.length > 0 && (
              <div>
                {favoriteApps.length > 0 && (
                  <h2 className="mb-3 text-sm font-semibold text-foreground">All Applications</h2>
                )}
                <AppGrid
                  apps={regularApps}
                  viewMode={preferences.view_mode}
                  showUrl={preferences.show_url}
                  accentColor={preferences.accent_color}
                  cardOpacity={preferences.card_opacity}
                  favoriteApps={preferences.favorite_apps}
                  onToggleFavorite={toggleFavorite}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                />
              </div>
            )}

            {filteredApps.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <h3 className="mb-1 text-base font-semibold text-foreground">No applications found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

interface AppGridProps {
  apps: Application[];
  viewMode: string;
  showUrl: boolean;
  accentColor: string;
  cardOpacity: number;
  favoriteApps: string[];
  onToggleFavorite: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}

function AppGrid({
  apps,
  viewMode,
  showUrl,
  accentColor,
  cardOpacity,
  favoriteApps,
  onToggleFavorite,
  onDragStart,
  onDragOver,
  onDragEnd,
}: AppGridProps) {
  const gridClass = {
    'grid-compact': 'grid gap-3 sm:grid-cols-3 lg:grid-cols-5',
    'grid-comfortable': 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
    list: 'flex flex-col gap-2',
  }[viewMode] || 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={gridClass}>
      {apps.map((app) => (
        <AppCard
          key={app.id}
          app={app}
          viewMode={viewMode}
          showUrl={showUrl}
          accentColor={accentColor}
          cardOpacity={cardOpacity}
          isFavorite={favoriteApps.includes(app.id)}
          onToggleFavorite={onToggleFavorite}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  );
}

interface AppCardProps {
  app: Application;
  viewMode: string;
  showUrl: boolean;
  accentColor: string;
  cardOpacity: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}

function AppCard({
  app,
  viewMode,
  showUrl,
  accentColor,
  cardOpacity,
  isFavorite,
  onToggleFavorite,
  onDragStart,
  onDragOver,
  onDragEnd,
}: AppCardProps) {
  const isList = viewMode === 'list';
  const isCompact = viewMode === 'grid-compact';

  return (
    <div
      draggable
      onDragStart={() => onDragStart(app.id)}
      onDragOver={(e) => onDragOver(e, app.id)}
      onDragEnd={onDragEnd}
      className={`group relative overflow-hidden rounded-lg border border-border transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 ${
        isList ? 'flex items-center gap-3 p-3' : isCompact ? 'p-3' : 'p-4'
      }`}
      style={{ backgroundColor: `rgba(26, 26, 26, ${cardOpacity / 100})` }}
    >
      {/* Health Status Badge */}
      {app.health_check_enabled === 1 && (
        <div className="absolute right-2 bottom-2">
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
              app.health_status === 'online'
                ? 'bg-green-500/10 text-green-500'
                : app.health_status === 'offline'
                ? 'bg-red-500/10 text-red-500'
                : 'bg-gray-500/10 text-gray-500'
            }`}
          >
            <Circle className="h-2 w-2 fill-current" />
            <span className="capitalize">{app.health_status}</span>
          </div>
        </div>
      )}

      {/* Drag Handle */}
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Favorite Toggle */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onToggleFavorite(app.id);
        }}
        className="absolute left-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Star
          className={`h-4 w-4 transition-all ${
            isFavorite ? '' : 'text-muted-foreground'
          }`}
          style={isFavorite ? { fill: accentColor, color: accentColor } : { color: undefined }}
          onMouseEnter={(e) => {
            if (!isFavorite) {
              e.currentTarget.style.color = accentColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!isFavorite) {
              e.currentTarget.style.color = '';
            }
          }}
        />
      </button>

      {/* App Content */}
      <a
        href={app.base_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex ${isList ? 'flex-1 items-center gap-3' : 'flex-col'}`}
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg ${
            isList ? 'h-10 w-10' : isCompact ? 'mb-2 h-10 w-10' : 'mb-3 h-12 w-12'
          }`}
          style={{
            backgroundColor: `${accentColor}20`,
          }}
        >
          <AppIcon iconName={app.icon} color={accentColor} />
        </div>

        <div className={isList ? 'flex-1' : ''}>
          <h3 className={`font-semibold text-foreground ${isList ? 'text-sm' : isCompact ? 'text-sm' : 'mb-1 text-base'}`}>
            {app.name}
          </h3>
          {!isCompact && (
            <p className={`text-muted-foreground ${isList ? 'text-xs' : 'mb-2 text-xs line-clamp-2'}`}>
              {app.description || 'No description available'}
            </p>
          )}

          {showUrl && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{app.base_url}</span>
            </div>
          )}
        </div>

        {isList && (
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        )}
      </a>

      {/* Subtle Gradient Overlay on Hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${accentColor}03 0%, transparent 50%)`,
        }}
      />
    </div>
  );
}
