import React from 'react';
import { Wrench, ShieldCheck, Timer, Signal, Sparkles, ArrowUpRight, Settings } from 'lucide-react';

interface FullScreenMaintenanceProps {
  message?: string;
}

export default function FullScreenMaintenance({ message }: FullScreenMaintenanceProps) {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-slate-950/80 pointer-events-none" />

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-violet-600/30 via-fuchsia-600/20 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-tl from-cyan-600/30 via-blue-600/20 to-transparent rounded-full blur-[150px]" />
        <div className="absolute top-[40%] right-[15%] w-[25%] h-[25%] bg-amber-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[30%] left-[10%] w-[20%] h-[20%] bg-pink-500/20 rounded-full blur-[100px]" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `fullscreen-float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: 0.1 + Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 sm:px-6">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6 sm:mb-10">
          <div className="relative w-14 h-14 sm:w-20 sm:h-20 mb-3 sm:mb-5">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-cyan-500/30 rounded-2xl blur-2xl animate-pulse" />
            <div className="relative w-full h-full rounded-2xl bg-slate-900/80 border border-white/10 p-3 sm:p-4 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-violet-500/10">
              <img
                src="/zi-logo.svg"
                alt="ZI Premium Services"
                width={48}
                height={48}
                className="object-contain w-7 h-7 sm:w-12 sm:h-12"
              />
            </div>
          </div>
          <h1 className="text-sm sm:text-xl font-black bg-gradient-to-r from-pink-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent cinzel-decorative-black tracking-wider">
            ZI PREMIUM SERVICES
          </h1>
        </div>

        {/* Card */}
        <div className="relative rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-xl">
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-slate-900/70" />

          {/* Gradient border top */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 z-10" />

          {/* Inner glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-violet-500/10 rounded-full blur-[60px] z-10" />

          <div className="relative px-5 sm:px-8 pt-6 sm:pt-10 pb-6 sm:pb-8 flex flex-col items-center text-center z-10">
            {/* Icon ring */}
            <div className="relative mb-4 sm:mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-white/10 flex items-center justify-center">
                <Settings className="w-5 h-5 sm:w-7 sm:h-7 text-white/70 animate-fullscreen-spin-slow" />
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight mb-2">
              Under Maintenance
            </h2>
            <p className="text-xs sm:text-sm text-white leading-relaxed max-w-sm mb-6 sm:mb-8">
              {message || "We're performing scheduled upgrades to serve you better. Everything will be back to normal shortly."}
            </p>

            {/* Status grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full mb-6 sm:mb-8">
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3.5 px-1 sm:px-2 rounded-xl bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-[8px] sm:text-[9px] text-white font-semibold uppercase tracking-widest">Security</span>
                <span className="text-[10px] sm:text-[11px] text-white font-medium">Encrypted</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3.5 px-1 sm:px-2 rounded-xl bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/20">
                <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                <span className="text-[8px] sm:text-[9px] text-white font-semibold uppercase tracking-widest">ETA</span>
                <span className="text-[10px] sm:text-[11px] text-white font-medium">Shortly</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3.5 px-1 sm:px-2 rounded-xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20">
                <Signal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-[8px] sm:text-[9px] text-white font-semibold uppercase tracking-widest">Status</span>
                <span className="text-[10px] sm:text-[11px] text-white font-medium">Updating</span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4 sm:mb-6" />

            {/* Support */}
            <a
              href="https://wa.me/8801733019261"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 sm:gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:from-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 group"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[11px] sm:text-xs text-white group-hover:text-white font-semibold tracking-wider transition-colors flex items-center gap-1 sm:gap-1.5">
                WhatsApp Support <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 sm:mt-8 text-center text-[9px] sm:text-[10px] text-white/10 font-semibold tracking-[0.2em] uppercase">
          &copy; {new Date().getFullYear()} ZI Premium Services
        </p>
      </div>
    </div>
  );
}
