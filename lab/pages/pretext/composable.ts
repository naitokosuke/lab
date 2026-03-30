import { layoutNextLine, type LayoutCursor, type PreparedTextWithSegments } from "@chenglou/pretext";

export interface Obstacle {
  id: number;
  cx: number;
  cy: number;
  r: number;
  color: string;
  glowColor: string;
}

export interface PositionedLine {
  x: number;
  y: number;
  text: string;
  width: number;
}

function getCircleBlockedInterval(
  obstacle: Obstacle,
  bandTop: number,
  bandBottom: number,
  padding: number,
): { left: number; right: number } | null {
  const { cx, cy, r } = obstacle;
  const effectiveR = r + padding;

  if (bandTop > cy + effectiveR || bandBottom < cy - effectiveR) return null;

  // Find the widest horizontal extent in the band.
  // This occurs at the y value closest to the circle center.
  const yClosest = Math.max(bandTop, Math.min(bandBottom, cy));
  const dy = yClosest - cy;
  const halfWidth = Math.sqrt(Math.max(0, effectiveR * effectiveR - dy * dy));

  return { left: cx - halfWidth, right: cx + halfWidth };
}

function mergeIntervals(intervals: { left: number; right: number }[]): { left: number; right: number }[] {
  if (intervals.length === 0) return [];
  intervals.sort((a, b) => a.left - b.left);
  const merged: { left: number; right: number }[] = [{ ...intervals[0] }];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    if (intervals[i].left <= last.right) {
      last.right = Math.max(last.right, intervals[i].right);
    } else {
      merged.push({ ...intervals[i] });
    }
  }
  return merged;
}

export function layoutTextAroundObstacles(
  prepared: PreparedTextWithSegments,
  obstacles: Obstacle[],
  regionX: number,
  regionY: number,
  regionWidth: number,
  regionHeight: number,
  lineHeight: number,
  padding: number,
): PositionedLine[] {
  const lines: PositionedLine[] = [];
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = regionY;
  const regionRight = regionX + regionWidth;
  const regionBottom = regionY + regionHeight;

  while (y + lineHeight <= regionBottom) {
    const bandTop = y;
    const bandBottom = y + lineHeight;

    const blocked: { left: number; right: number }[] = [];
    for (const obstacle of obstacles) {
      const interval = getCircleBlockedInterval(obstacle, bandTop, bandBottom, padding);
      if (interval) blocked.push(interval);
    }

    const merged = mergeIntervals(blocked);

    // Carve available slots from the region
    const slots: { left: number; right: number }[] = [];
    let slotLeft = regionX;
    for (const interval of merged) {
      const cl = Math.max(regionX, interval.left);
      const cr = Math.min(regionRight, interval.right);
      if (cl > slotLeft) slots.push({ left: slotLeft, right: cl });
      slotLeft = Math.max(slotLeft, cr);
    }
    if (slotLeft < regionRight) slots.push({ left: slotLeft, right: regionRight });

    if (slots.length === 0) {
      y += lineHeight;
      continue;
    }

    // Pick the widest slot
    let best = slots[0];
    for (let i = 1; i < slots.length; i++) {
      if (slots[i].right - slots[i].left > best.right - best.left) best = slots[i];
    }

    const slotWidth = best.right - best.left;
    if (slotWidth < 40) {
      y += lineHeight;
      continue;
    }

    const line = layoutNextLine(prepared, cursor, slotWidth);
    if (line === null) break;

    lines.push({ x: best.left, y, text: line.text, width: line.width });
    cursor = line.end;
    y += lineHeight;
  }

  return lines;
}
