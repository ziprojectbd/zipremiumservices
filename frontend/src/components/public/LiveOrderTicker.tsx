import React, { useState, useEffect, useRef } from 'react';

interface LiveOrder {
  flag?: string;
  /** Resolved country name, e.g. "Bangladesh". Empty when unknown. */
  country?: string;
  countryCode?: string;
  user?: string;
  service?: string;
  time?: string;
}

interface LiveOrderTickerProps {
  orders: LiveOrder[];
  /** Height of the visible window in px (default 48) */
  height?: number;
  /** Interval per item in ms (default 4000) */
  interval?: number;
}

export default function LiveOrderTicker({ orders, height = 48, interval = 4000 }: LiveOrderTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const items = orders.slice(0, 20);

  useEffect(() => {
    if (items.length <= 1) return;

    timerRef.current = setInterval(() => {
      setPrevIndex(i => i);
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, interval]);

  if (items.length === 0) return null;

  const order = items[currentIndex];

  return (
    <div className="relative overflow-hidden" style={{ height: `${height}px` }}>
      <div
        key={currentIndex}
        className="absolute inset-0 flex items-center justify-between px-3 transition-all duration-500 ease-in-out"
        style={{
          animation: 'tickerFadeIn 0.5s ease-in-out',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Country flag resolved from the order's IP address. */}
          <span
            className="text-sm leading-none flex-shrink-0"
            title={order.country || order.countryCode || 'Unknown location'}
            aria-label={order.country || 'Unknown location'}
          >
            {order.flag || '🌐'}
          </span>
          <div className="min-w-0">
            <span className="text-white/70 text-[11px] font-semibold truncate block leading-tight">
              {order.user}
              {order.country ? (
                <span className="text-white/35 font-normal"> · {order.country}</span>
              ) : null}
            </span>
            <span className="text-purple-300/60 text-[10px] truncate block leading-tight">{order.service}</span>
          </div>
        </div>
        {order.time ? (
          <span className="text-white/30 text-[9px] flex-shrink-0 ml-2">{order.time}</span>
        ) : null}
      </div>

      <style>{`
        @keyframes tickerFadeIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
