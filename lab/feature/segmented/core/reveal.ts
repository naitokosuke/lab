/** Where a tab sits in its scrolling row, and how the row is scrolled now (all in px) */
export interface RevealInput {
  /** the tab's offsetLeft */
  start: number;
  /** the tab's offsetWidth */
  size: number;
  /** the row's scrollLeft */
  scroll: number;
  /** the row's clientWidth */
  viewport: number;
  /** room to leave beside the tab once it is brought in */
  pad: number;
}

/**
 * The row's scrollLeft that brings the tab (with `pad` either side) into view, or `null` when
 * it is in view already. A tab off to the left is aligned to the left edge, one off to the
 * right to the right edge; the row moves no further than that.
 */
export function revealScroll({ start, size, scroll, viewport, pad }: RevealInput): number | null {
  const left = start - pad;
  const right = start + size + pad - viewport;
  if (left < scroll) return left;
  if (right > scroll) return right;
  return null;
}
