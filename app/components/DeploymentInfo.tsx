'use client';

import { useEffect, useState } from 'react';

interface DeploymentInfoProps {
  className?: string;
}

export function DeploymentInfo({ className = '' }: DeploymentInfoProps) {
  const [deployedAt, setDeployedAt] = useState<number | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Fetch deployment time on mount
  useEffect(() => {
    async function fetchDeploymentInfo() {
      try {
        const response = await fetch('/api/deployment-info');
        const data = await response.json();
        setDeployedAt(data.deployedAt);
      } catch (error) {
        console.error('Failed to fetch deployment info:', error);
      }
    }

    fetchDeploymentInfo();
  }, []);

  // Update relative time every minute
  useEffect(() => {
    if (!deployedAt) return;

    function updateTimeAgo() {
      if (!deployedAt) return;

      const now = Date.now();
      const diff = now - deployedAt;

      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days > 0) {
        setTimeAgo(`před ${days} ${days === 1 ? 'dnem' : days < 5 ? 'dny' : 'dny'}`);
      } else if (hours > 0) {
        setTimeAgo(`před ${hours} ${hours === 1 ? 'hodinou' : hours < 5 ? 'hodinami' : 'hodinami'}`);
      } else if (minutes > 0) {
        setTimeAgo(`před ${minutes} ${minutes === 1 ? 'minutou' : minutes < 5 ? 'minutami' : 'minutami'}`);
      } else {
        setTimeAgo('právě teď');
      }
    }

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deployedAt]);

  if (!timeAgo) return null;

  return (
    <div className={`text-xs text-neutral-500 ${className}`}>
      Nasazeno {timeAgo}
    </div>
  );
}
