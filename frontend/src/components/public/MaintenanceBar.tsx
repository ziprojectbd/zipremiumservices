import React from 'react';
import { useRealtimeMaintenance } from '../../hooks/useRealtimeData';

export default function MaintenanceBar() {
  const { data, loading } = useRealtimeMaintenance({ autoRefresh: true, pollInterval: 3000 });

  const maintenanceMode = data?.enabled ?? false;
  const maintenanceType = data?.type ?? 'marquee';
  const customMessage = data?.message || '';

  if (loading || !maintenanceMode || maintenanceType !== 'marquee') return null;

  return (
    <div className="relative w-full overflow-hidden py-3 sm:py-4 shadow-[0_4px_30px_rgba(0,0,0,0.3)] z-[100] border-b border-white/10 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-blue-900/40 to-slate-950 animate-gradient-x" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

      <div className="relative z-10 flex animate-marquee whitespace-nowrap items-center hover:[animation-play-state:paused] transition-all will-change-transform transform-gpu">
        <div className="flex items-center gap-4 px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-white font-black text-[10px] sm:text-xs tracking-[0.2em] uppercase italic">
              System Update
            </span>
          </div>
          <span className="text-blue-100 font-bold text-xs sm:text-sm tracking-wide">
            {customMessage || '\u26A1 SYSTEM MAINTENANCE IN PROGRESS — WE ARE OPTIMIZING YOUR EXPERIENCE'}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-white/20 mx-4" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-white font-black text-[10px] sm:text-xs tracking-[0.2em] uppercase italic">
              System Update
            </span>
          </div>
          <span className="text-blue-100 font-bold text-xs sm:text-sm tracking-wide">
            {customMessage || '\u26A1 SYSTEM MAINTENANCE IN PROGRESS — WE ARE OPTIMIZING YOUR EXPERIENCE'}
          </span>
        </div>
      </div>
    </div>
  );
}
