'use client';

import { useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

export function HealthCheckButton() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runHealthCheck = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/health-check', {
        method: 'GET',
      });

      if (response.ok) {
        setLastCheck(new Date());
      }
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <button
      onClick={runHealthCheck}
      disabled={isChecking}
      className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isChecking ? (
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <Activity className="h-5 w-5 text-primary" />
      )}
      <div className="flex flex-col items-start">
        <span className="font-medium">
          {isChecking ? 'Checking Apps...' : 'Health Check'}
        </span>
        {lastCheck && (
          <span className="text-xs text-muted-foreground">
            Last: {lastCheck.toLocaleTimeString()}
          </span>
        )}
      </div>
    </button>
  );
}
