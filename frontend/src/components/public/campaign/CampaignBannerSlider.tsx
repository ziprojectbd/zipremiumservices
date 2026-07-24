import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import CountdownTimer from "./CountdownTimer";

interface Banner {
  _id: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  link?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  textColor?: string;
  // Campaign info injected from parent
  campaignName?: string;
  campaignSlug?: string;
  campaignColor?: string;
  campaignEndDate?: string;
}

interface CampaignBannerSliderProps {
  banners: Banner[];
  autoPlayInterval?: number;
  height?: string;
}

export default function CampaignBannerSlider({
  banners,
  autoPlayInterval = 5000,
  height = "h-[300px] md:h-[400px]",
}: CampaignBannerSliderProps) {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(next, autoPlayInterval);
    return () => clearInterval(interval);
  }, [banners.length, autoPlayInterval, next]);

  if (!banners.length) return null;

  const banner = banners[current];

  return (
    <div className={`relative ${height} rounded-2xl overflow-hidden group`}>
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: banner.imageUrl ? `url(${banner.imageUrl})` : undefined,
          backgroundColor: banner.backgroundColor || "#1e1b4b",
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
        {banner.campaignName && (
          <div className="flex items-center gap-2 mb-2">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                background: `${banner.campaignColor || "#ef4444"}22`,
                border: `1px solid ${banner.campaignColor || "#ef4444"}44`,
                color: banner.campaignColor || "#ef4444",
              }}
            >
              {banner.campaignName}
            </span>
            {banner.campaignEndDate && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                <Clock className="w-3 h-3 text-red-400" />
                <CountdownTimer
                  endDate={banner.campaignEndDate}
                  colorTheme="#ef4444"
                  compact
                />
              </div>
            )}
          </div>
        )}

        {banner.title && (
          <h3
            className="text-2xl md:text-4xl font-bold mb-2 drop-shadow-lg"
            style={{ color: banner.textColor || "#fff" }}
          >
            {banner.title}
          </h3>
        )}

        {banner.subtitle && (
          <p
            className="text-sm md:text-lg mb-4 drop-shadow-md max-w-xl"
            style={{ color: banner.textColor ? `${banner.textColor}cc` : "#ffffffcc" }}
          >
            {banner.subtitle}
          </p>
        )}

        {banner.buttonText && (
          <button
            onClick={() => {
              if (banner.buttonLink) navigate(banner.buttonLink);
              else if (banner.campaignSlug) navigate(`/special-offer?campaign=${banner.campaignSlug}`);
            }}
            className="inline-flex items-center px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${banner.campaignColor || "#ef4444"}, ${banner.campaignColor || "#ef4444"}cc)`,
              color: "#fff",
            }}
          >
            {banner.buttonText}
          </button>
        )}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`transition-all rounded-full ${
                  idx === current ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
