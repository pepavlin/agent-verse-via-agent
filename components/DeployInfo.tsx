'use client';

import { BUILD_CONFIG } from '@/lib/build-config';

export default function DeployInfo() {
  const deployDate = BUILD_CONFIG.deployDate;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);

    // Format to Czech timezone (CET/CEST - Europe/Prague)
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Prague',
    };

    const formatter = new Intl.DateTimeFormat('cs-CZ', options);
    const parts = formatter.formatToParts(date);

    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;

    return `${day}.${month}.${year} v ${hour}:${minute}`;
  };

  return (
    <div className="text-center text-purple-300/70 text-sm">
      Poslední deploy: {formatDate(deployDate)}
    </div>
  );
}
