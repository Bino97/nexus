'use client';

import { useState, useEffect } from 'react';
import { Application } from '@/lib/types';
import ModernDashboard from './ModernDashboard';
import DashboardHeader from './DashboardHeader';

interface DashboardWrapperProps {
  initialApps: Application[];
  userName: string;
  isAdmin: boolean;
}

export default function DashboardWrapper({ initialApps, userName, isAdmin }: DashboardWrapperProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [cardOpacity, setCardOpacity] = useState(100);

  // Trigger health check on mount
  useEffect(() => {
    fetch('/api/health-check', {
      method: 'GET',
    }).catch((error) => {
      console.error('Health check failed:', error);
    });
  }, []);

  return (
    <>
      <DashboardHeader
        isAdmin={isAdmin}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showCustomizer={showCustomizer}
        onToggleCustomizer={() => setShowCustomizer(!showCustomizer)}
        accentColor={accentColor}
        cardOpacity={cardOpacity}
      />
      <ModernDashboard
        initialApps={initialApps}
        userName={userName}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showCustomizer={showCustomizer}
        onToggleCustomizer={() => setShowCustomizer(!showCustomizer)}
        onAccentColorChange={setAccentColor}
        onOpacityChange={setCardOpacity}
      />
    </>
  );
}
