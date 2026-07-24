import React from "react";
import { useRealtimePromoMarquee } from "../../hooks/useRealtimeData";

const PromoMarquee = () => {
    const { data, loading } = useRealtimePromoMarquee({ autoRefresh: true, pollInterval: 3000 });

    const promoMarqueeEnabled = data?.enabled ?? true;
    const customMessage = data?.message || '';

    if (loading || !promoMarqueeEnabled) return null;

    return (
        <div className="relative w-full overflow-hidden py-3 shadow-lg z-40 border-y border-white/10 bg-[#0f172a]">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 opacity-90" />
            <div className="relative z-20 animate-marquee whitespace-nowrap text-white font-black text-xs sm:text-xl tracking-tight leading-tight">
                {customMessage}
                {customMessage}
            </div>
            <div className="absolute top-0 left-0 bottom-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-30 pointer-events-none" />
            <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-30 pointer-events-none" />
        </div>
    );
};

export default PromoMarquee;
