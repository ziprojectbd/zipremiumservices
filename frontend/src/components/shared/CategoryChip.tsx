import { useEffect, useRef, type ReactNode } from 'react';

/**
 * The category chip, defined once.
 *
 * The storefront filter bar and the admin filter row both render through these
 * pieces, so the two can never drift apart visually. The markup and classes here
 * are the storefront's original chip, moved out of CategoryFilterBar unchanged.
 */

// ---------------------------------------------------------------------------
// Horizontal panning
//
// Extracted from the component so the interaction can be exercised without a
// browser: `attachRowScroll` takes a scroll element and an event bus (the window
// in production, a stub in tests) and returns a cleanup function.
// ---------------------------------------------------------------------------

/** A pointer move is treated as a drag past this many pixels. */
export const DRAG_THRESHOLD = 4;

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
