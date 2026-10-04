import { useEffect, useRef, type ReactNode } from 'react';

/** A pointer move is treated as a drag past this many pixels. */
export const DRAG_THRESHOLD = 4;

/** The storefront category chip, styled after the airdrop page tab buttons. */

/**
 * Turns a Tailwind gradient string like "from-cyan-500 to-blue-500" into
 * a Tailwind class string with opacity: "bg-gradient-to-r from-cyan-500/20 to-blue-500/20".
 */
function gradientWithOpacity(gradient: string | undefined, opacity = 20): string {
  const base = gradient || 'from-purple-500 to-indigo-500';
  const withOpacity = base.replace(/(\w+)-500\b/g, (_, color) => `${color}-500/${opacity}`);
  return `bg-gradient-to-r ${withOpacity}`;
}

/**
 * Bright label color for inactive chips, matching the category's gradient hue.
 * Literal class names so Tailwind generates each utility.
 */
const CATEGORY_TEXT_COLORS: Record<string, string> = {
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  cyan: 'text-cyan-400',
  emerald: 'text-emerald-400',
  fuchsia: 'text-fuchsia-400',
  gray: 'text-slate-300',
  green: 'text-green-400',
  indigo: 'text-indigo-400',
  orange: 'text-orange-400',
  pink: 'text-pink-400',
  purple: 'text-purple-400',
  red: 'text-red-400',
  rose: 'text-rose-400',
  sky: 'text-sky-400',
  slate: 'text-slate-300',
  teal: 'text-teal-400',
  violet: 'text-violet-400',
  yellow: 'text-yellow-400',
};

/** Bright label color matching the gradient's first hue (e.g. from-cyan-500 → text-cyan-400). */
function categoryTextColor(gradient?: string): string {
  const hue = gradient?.match(/\bfrom-([a-z]+)-\d+/i)?.[1]?.toLowerCase();
  return (hue && CATEGORY_TEXT_COLORS[hue]) || 'text-purple-400';
}

/** The chip's Tailwind classes. */
export function categoryChipClass(active: boolean, gradient?: string): string {
  return [
    'snap-start shrink-0 relative flex items-center gap-1 sm:gap-2 px-3 sm:px-8 py-3 sm:py-5 text-[10px] sm:text-sm font-russo antialiased transition-all duration-500 rounded-xl whitespace-nowrap group border overflow-hidden',
    active
      ? 'text-white border-white/10'
      : `${categoryTextColor(gradient)} hover:text-white hover:border-white/30`,
  ].join(' ');
}

/** The subset of an element's surface this needs. */
export interface RowScrollHost {
  scrollWidth: number;
  clientWidth: number;
  scrollLeft: number;
  style: { cursor: string; userSelect: string };
  addEventListener: (type: string, listener: (event: any) => void, options?: any) => void;
  removeEventListener: (type: string, listener: (event: any) => void, options?: any) => void;
}

/** The event bus the drag listeners are attached to (the window). */
export interface RowEventBus {
  addEventListener: (type: string, listener: (event: any) => void) => void;
  removeEventListener: (type: string, listener: (event: any) => void) => void;
}

/**
 * Makes a chip row pan horizontally and returns a cleanup function.
 *
 * - a vertical mouse wheel pans the row, and is released at either end so the
 *   page still scrolls normally
 * - mouse drag pans the row, and the click that ends a drag is swallowed so a
 *   chip is not selected by accident
 * - touch is ignored here and left to the browser's native scrolling
 */
export function attachRowScroll(el: RowScrollHost, bus: RowEventBus = window): () => void {
  const canScroll = () => el.scrollWidth > el.clientWidth;

  const onWheel = (event: WheelEvent) => {
    if (!canScroll()) return;
    // Trackpad horizontal gesture — let the browser handle it.
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (event.deltaY === 0) return;

    const atStart = el.scrollLeft <= 0;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    if ((atStart && event.deltaY < 0) || (atEnd && event.deltaY > 0)) return;

    event.preventDefault();
    el.scrollLeft += event.deltaY;
  };

  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    if (!canScroll()) return;
    dragging = true;
    moved = false;
    startX = event.clientX;
    startScroll = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > DRAG_THRESHOLD) moved = true;
    el.scrollLeft = startScroll - delta;
  };

  const stopDrag = () => {
    if (!dragging) return;
    dragging = false;
    el.style.cursor = '';
    el.style.userSelect = '';
  };

  // Capture phase: swallow the click that terminates a drag.
  const onClickCapture = (event: { stopPropagation: () => void; preventDefault: () => void }) => {
    if (!moved) return;
    event.stopPropagation();
    event.preventDefault();
    moved = false;
  };

  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('pointerdown', onPointerDown);
  bus.addEventListener('pointermove', onPointerMove);
  bus.addEventListener('pointerup', stopDrag);
  el.addEventListener('click', onClickCapture, true);

  return () => {
    el.removeEventListener('wheel', onWheel);
    el.removeEventListener('pointerdown', onPointerDown);
    bus.removeEventListener('pointermove', onPointerMove);
    bus.removeEventListener('pointerup', stopDrag);
    el.removeEventListener('click', onClickCapture, true);
  };
}

/** The chip's icon slot. */
export function CategoryChipIcon({ icon, active, gradient }: { icon: ReactNode; active: boolean; gradient?: string }) {
  const accentColor = gradient
    ? gradient.split(' ')[0].replace('from-', '').replace(/-\d+$/, '-400')
    : 'text-purple-400';
  const inactiveColor = 'text-white/40 group-hover:text-white/80';
  return (
    <span
      className={`relative z-10 w-6 h-6 flex items-center justify-center ${
        active
          ? `${accentColor} scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]`
          : inactiveColor
      }`}
    >
      {icon}
    </span>
  );
}

/** The chip's label slot. */
export function CategoryChipLabel({ children }: { children: ReactNode }) {
  return (
    <span className="relative z-10 text-[10px] sm:text-sm font-bold tracking-wider sm:tracking-widest ml-1">{children}</span>
  );
}

/** Product count shown next to a chip's label. */
export function CategoryChipCount({ value, active, color }: { value: number; active: boolean; color?: string }) {
  const inactiveColor = color || 'text-purple-400';
  return (
    <span
      className={`relative z-10 text-[10px] font-bold rounded-md px-2 py-0.5 border ${
        active ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : `bg-white/5 ${inactiveColor} border-white/10`
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

/** A single selectable category chip, styled like the airdrop page tab buttons. */
export default function CategoryChip({
  label,
  icon,
  gradient,
  active,
  onClick,
  title,
  children,
}: CategoryChipProps) {
  const accentGradient = gradient || 'from-purple-500 to-indigo-500';
  const activeOverlay = gradientWithOpacity(accentGradient, 20);
  const hoverOverlay = gradientWithOpacity(accentGradient, 10);
  const overlayClass = active ? activeOverlay : `bg-transparent group-hover:${hoverOverlay}`;
  const indicatorClass = `absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] sm:h-[3px] bg-gradient-to-r rounded-t-full transition-all duration-500 shadow-[0_0_15px_rgba(168,85,247,1)] ${active ? 'w-6 sm:w-10 opacity-100' : 'w-0 opacity-0 group-hover:w-4 sm:group-hover:w-6 group-hover:opacity-100'} ${accentGradient}`;

  return (
    <button
      type="button"
      data-active={active}
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={categoryChipClass(active, gradient)}
    >
      <div className={`absolute inset-0 transition-all duration-500 ${overlayClass}`} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none hidden sm:block">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-shimmer-fast" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-shimmer-fast delay-75" />
      </div>
      <div className={indicatorClass} />
      <CategoryChipLabel>{label}</CategoryChipLabel>
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
  /**
   * Called with the horizontal scroll progress (0-1) so a parent can render a
   * progress indicator for the row.
   */
  onProgressChange?: (progress: number) => void;
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
  onProgressChange,
}: CategoryChipRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track scroll progress for the visual progress bar
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !onProgressChange) return;

    const handleScroll = () => {
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const progress = Math.min(Math.max(el.scrollLeft / maxScroll, 0), 1);
      onProgressChange(progress);
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [onProgressChange]);

  // Wheel panning + click-and-drag panning. See attachRowScroll for the details.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    return attachRowScroll(el);
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
    // `min-w-0 w-full` keeps the row at its parent's width even when the parent is
    // a flex/grid container; without it a flex item's min-content width would let
    // the row grow to fit every chip, so `overflow-x-auto` would never engage and
    // the row simply could not scroll.
    <div className={`relative w-full min-w-0 ${className}`}>
      <div
        className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r ${fadeFrom} to-transparent z-10 rounded-l-2xl`}
      />
      <div
        className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l ${fadeFrom} to-transparent z-10 rounded-r-2xl`}
      />
      <div
        ref={scrollRef}
        className="flex flex-nowrap gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-1.5 snap-x cursor-grab"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          // Reaching an edge must not chain the scroll to the page.
          overscrollBehaviorX: 'contain',
        }}
      >
        {children}
      </div>
    </div>
  );
}
