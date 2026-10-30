import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  endDate: string | number | Date;
  colorTheme?: string;
  compact?: boolean;
  onExpired?: () => void;
}

export default function CountdownTimer({
  endDate,
  colorTheme = "#ef4444",
  compact = false,
  onExpired,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const target = new Date(endDate).getTime();

    function tick() {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setExpired(true);
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onExpired?.();
        return;
      }

      setRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endDate, onExpired]);

  if (expired) {
    return (
      <span className="text-red-400 text-xs font-bold">Offer Ended</span>
    );
  }

  if (!remaining) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs font-mono font-bold" style={{ color: colorTheme }}>
        {remaining.days > 0 && <span>{remaining.days}d </span>}
        <span>{String(remaining.hours).padStart(2, "0")}:</span>
        <span>{String(remaining.minutes).padStart(2, "0")}:</span>
        <span>{String(remaining.seconds).padStart(2, "0")}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {[
        { label: "Days", value: remaining.days },
        { label: "Hrs", value: String(remaining.hours).padStart(2, "0") },
        { label: "Min", value: String(remaining.minutes).padStart(2, "0") },
        { label: "Sec", value: String(remaining.seconds).padStart(2, "0") },
      ].map((unit, idx) => (
        <React.Fragment key={unit.label}>
          <div className="flex flex-col items-center">
            <div
              className="rounded-lg px-2 py-1 min-w-[36px] text-center font-bold text-sm"
              style={{
                background: `${colorTheme}22`,
                border: `1px solid ${colorTheme}44`,
                color: colorTheme,
              }}
            >
              {unit.value}
            </div>
            <span className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider">
              {unit.label}
            </span>
          </div>
          {idx < 3 && (
            <span
              className="text-lg font-bold mb-3"
              style={{ color: `${colorTheme}66` }}
            >
              :
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
