/** 0 at 0, 1 at 1, flat at both ends: a soft shoulder rather than a cone */
export function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/**
 * How much an icon grows with the pointer `distance` px from where it rests: `1 + grow` right
 * under the pointer, falling off smoothly to 1 (its own size) at `reach` px and beyond.
 */
export function magnification(distance: number, reach: number, grow: number): number {
  if (!(reach > 0)) return 1;
  const t = Math.max(0, 1 - Math.abs(distance) / reach);
  return 1 + grow * smoothstep(t);
}
