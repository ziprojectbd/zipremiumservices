import React from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../../../utils/formatPrice";

interface CampaignBadgeProps {
  name: string;
  slug: string;
  color?: string;
  discountPercent?: number;
  amountSaved?: number;
  compact?: boolean;
}

export default function CampaignBadge({
  name,
  slug,
  color = "#ef4444",
  discountPercent = 0,
  amountSaved = 0,
  compact = false,
}: CampaignBadgeProps) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/special-offer?campaign=${slug}`);
        }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-lg transition-all hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          color: "#fff",
        }}
      >
        {discountPercent > 0 && `${Math.round(discountPercent)}% `}
        {name}
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/special-offer?campaign=${slug}`);
      }}
      className="group relative overflow-hidden rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      <span className="relative z-10 flex items-center gap-1.5">
        {discountPercent > 0 && (
          <span className="bg-white/20 rounded px-1 py-0.5 text-[10px]">
            -{Math.round(discountPercent)}%
          </span>
        )}
        {name}
        {amountSaved > 0 && (
          <span className="text-yellow-300 ml-1">
            Save ৳{formatPrice(amountSaved, 0)}
          </span>
        )}
      </span>
    </button>
  );
}
