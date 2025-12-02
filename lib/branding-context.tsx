'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface BrandingSettings {
  site_name: string;
  site_tagline: string;
  logo_url: string | null;
  primary_color: string;
}

const defaultBranding: BrandingSettings = {
  site_name: 'NEXUS',
  site_tagline: 'Application Hub',
  logo_url: null,
  primary_color: '#3b82f6',
};

const BrandingContext = createContext<BrandingSettings>(defaultBranding);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);

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

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
