import React, { useEffect, useState } from "react";

const imageCache = new Map<string, HTMLImageElement>();

export const getPreloadedImage = (src: string): HTMLImageElement | null =>
  imageCache.get(src) || null;

export const isImagePreloaded = (src: string): boolean =>
  imageCache.get(src)?.complete ?? false;

export const arePopupImagesPreloaded = (): boolean => [].every(src => isImagePreloaded(src));

export const getPreloadedPopupImages = (): HTMLImageElement[] => {
  const images: string[] = [];
  return images.map(src => getPreloadedImage(src)).filter(Boolean) as HTMLImageElement[];
};

export default function LoadingScreen({
  onFinish,
  canFinish = true,
}: {
  onFinish?: () => void;
  canFinish?: boolean;
}) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!canFinish) return;
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => onFinish?.(), 400);
    }, 500);
    return () => clearTimeout(timer);
  }, [onFinish, canFinish]);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes ls-bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes ls-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ls-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.25; }
        }
      `}} />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #020617 0%, #1e1b4b 50%, #020617 100%)",
          transition: "opacity 400ms ease",
          opacity: fadeOut ? 0 : 1,
          pointerEvents: fadeOut ? "none" : "auto",
        }}
      >
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {[
            { w: 120, t: "20%", l: "15%", color: "139,92,246" },
            { w: 80, b: "25%", r: "10%", color: "249,115,22" },
            { w: 60, t: "40%", r: "30%", color: "56,189,248" },
          ].map((p, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: p.w,
                height: p.w,
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(${p.color},0.2), transparent)`,
                top: p.t || "auto",
                bottom: p.b || "auto",
                left: p.l || "auto",
                right: p.r || "auto",
                animation: `ls-float 5s ease-in-out infinite`,
                animationDelay: `${i}s`,
              }}
            />
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 100,
                height: 100,
                marginTop: -50,
                marginLeft: -50,
                border: "2px solid transparent",
                borderTopColor: "#f97316",
                borderRightColor: "#ec4899",
                borderRadius: "50%",
                animation: "ls-spin 2.5s linear infinite",
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 10,
                width: 56,
                height: 56,
                backgroundImage: "url('/zi-logo.svg')",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                borderRadius: 12,
              }}
            />
          </div>

          <div style={{ textAlign: "center" }}>
            <h1
              className="cinzel-decorative-black"
              style={{
                fontSize: "clamp(1.4rem, 4vw, 1.8rem)",
                fontWeight: 800,
                background: "linear-gradient(90deg, #ec4899, #f59e0b, #38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: 0,
              }}
            >
              ZI PREMIUM SERVICES
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[0, 0.2, 0.4].map((delay) => (
              <span
                key={delay}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f97316, #ec4899)",
                  animation: "ls-bounce 1.4s infinite ease-in-out both",
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
