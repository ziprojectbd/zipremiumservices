import { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { subscribeMaintenance } from '../../lib/socket';

interface MaintenanceInfo {
  enabled: boolean;
  type: 'marquee' | 'fullscreen';
  message: string;
}

export default function MaintenanceBar() {
  const [info, setInfo] = useState<MaintenanceInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsub = subscribeMaintenance((data) => {
      if (data.enabled && data.type === 'marquee') {
        setInfo(data);
      } else {
        setInfo(null);
      }
    });

    return unsub;
  }, []);

  if (!info || !info.enabled || dismissed) return null;

  return (
    <div className="relative z-[100] bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white">
      <div className="relative overflow-hidden">
        <div className="flex items-center whitespace-nowrap animate-marquee py-1.5">
          <span className="mx-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {info.message || '⚠ System maintenance in progress'}
          </span>
          <span className="mx-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {info.message || '⚠ System maintenance in progress'}
          </span>
          <span className="mx-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {info.message || '⚠ System maintenance in progress'}
          </span>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
