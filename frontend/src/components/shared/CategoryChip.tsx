import { useEffect, useRef, type ReactNode } from 'react';

/**
 * The category chip, defined once.
 *
 * The storefront filter bar and the admin filter row both render through these
 * pieces, so the two can never drift apart visually. The markup and classes here
 * are the storefront's original chip, moved out of CategoryFilterBar unchanged.
 */

/** The chip's Tailwind classes. `gradient` is a Tailwind pair like "from-cyan-500 to-blue-500". */
export function categoryChipClass(active: boolean, gradient?: string): string {
  return [
    'snap-start shrink-0 relative px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg transition-all duration-200',
    'font-semibold shadow-md overflow-hidden group flex items-center gap-1 sm:gap-2 backdrop-blur-sm border whitespace-nowrap',
    active
      ? `bg-gradient-to-r ${gradient || 'from-gray-500 to-slate-500'} text-white shadow-lg border-white/20 scale-105`
      : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/20 hover:shadow-lg hover:scale-102 border-white/10 hover:border-white/30',
  ].join(' ');
}

/** The chip's icon slot. */
export function CategoryChipIcon({ icon, active }: { icon: ReactNode; active: boolean }) {
  return (
    <span
      className={`text-xs sm:text-base filter drop-shadow-sm ${
        active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
      }`}
    >
      {icon}
    </span>
  );
}

/** The chip's label slot. */
export function CategoryChipLabel({ children }: { children: ReactNode }) {
  return (
    <span className="relative z-10 text-[10px] sm:text-sm font-semibold tracking-tight">{children}</span>
  );
}

/** Decorative overlays that make the active chip shimmer on hover. */
export function CategoryChipShine({ active }: { active: boolean }) {
  if (!active) {
    return (
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    );
  }
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer bg-[length:200%_100%]" />
      <div className="absolute -inset-0.5 bg-gradient-to-r opacity-20 blur-sm group-hover:opacity-30 transition-opacity duration-300" />
    </>
  );
}

/** Product count shown next to a chip's label. */
export function CategoryChipCount({ value, active }: { value: number; active: boolean }) {
  return (
    <span
      className={`relative z-10 text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
        active ? 'bg-white/25 text-white' : 'bg-black/30 text-gray-400'
      }`}
    >
      {value}
    </span>
  );
}

/** Amber note marking a category whose products are hidden from the storefront. */
export function CategoryChipHiddenBadge({ value }: { value: number }) {
  return (
    <span
      className="relative z-10 text-[10px] font-semibold rounded-full px-1.5 py-0.5 bg-amber-500/25 text-amber-200"
      title={`${value} product(s) hidden from the storefront`}
    >
      hidden
    </span>
  );
}

export interface CategoryChipProps {
  label: string;
  icon: ReactNode;
  gradient?: string;
  active: boolean;
  onClick?: () => void;
  title?: string;
  /** Rendered inside the chip after the label (a count, a badge, …). */
  children?: ReactNode;
}

/** A single selectable category chip. */
export default function CategoryChip({
  label,
  icon,
  gradient,
  active,
  onClick,
  title,
  children,
}: CategoryChipProps) {
  return (
    <button
      type="button"
      data-active={active}
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={categoryChipClass(active, gradient)}
    >
      <CategoryChipIcon icon={icon} active={active} />
      <CategoryChipLabel>{label}</CategoryChipLabel>
      <CategoryChipShine active={active} />
      {children}
    </button>
  );
}

export interface CategoryChipRowProps {
  children: ReactNode;
  /**
   * Background the fade edges blend into. Matches the surrounding surface so the
   * row looks faded at both ends instead of cut off.
   */
  fadeFrom?: string;
  className?: string;
  /**
   * Label of the chip to keep centred. Scrolls horizontally only — the page
   * itself never moves.
   */
  centerOn?: string;
}

/**
 * Horizontal, scrollable chip row with the storefront's fade edges.
 *
 * A vertical mouse wheel pans the row horizontally (a plain wheel over an
 * overflow-x container otherwise does nothing on Windows/Linux), and the wheel
 * is released at either end so the page still scrolls.
 */
export function CategoryChipRow({
  children,
  fadeFrom = 'from-slate-950',
  className = '',
  centerOn,
}: CategoryChipRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      // Trackpad horizontal gesture — let the browser handle it.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY === 0) return;

      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      if ((atStart && e.deltaY < 0) || (atEnd && e.deltaY > 0)) return;

      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Keep the selected chip in view when the selection changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !centerOn) return;
    const active = el.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) return;
    const target = active.offsetLeft - (el.clientWidth - active.clientWidth) / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [centerOn]);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r ${fadeFrom} to-transparent z-10 rounded-l-2xl`}
      />
      <div
        className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l ${fadeFrom} to-transparent z-10 rounded-r-2xl`}
      />
      <div
        ref={scrollRef}
        className="flex flex-nowrap gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-1.5 snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </div>
  );
}
