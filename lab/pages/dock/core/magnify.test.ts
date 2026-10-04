import { describe, expect, test } from "vite-plus/test";

import { magnification, smoothstep } from "./magnify";

describe("smoothstep", () => {
  test("from 0 to 1, halfway at the middle", () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(0.5)).toBe(0.5);
    expect(smoothstep(1)).toBe(1);
  });

  test("clamped outside 0..1", () => {
    expect(smoothstep(-1)).toBe(0);
    expect(smoothstep(2)).toBe(1);
  });

  test("a soft shoulder: flatter than a straight line near the ends", () => {
    expect(smoothstep(0.1)).toBeLessThan(0.1);
    expect(smoothstep(0.9)).toBeGreaterThan(0.9);
  });
});

describe("magnification", () => {
  const REACH = 120;
  const GROW = 0.55;

  test("the icon under the pointer grows the most", () => {
    expect(magnification(0, REACH, GROW)).toBeCloseTo(1.55);
  });

  test("at the edge of the reach and beyond, its own size", () => {
    expect(magnification(REACH, REACH, GROW)).toBe(1);
    expect(magnification(REACH * 3, REACH, GROW)).toBe(1);
  });

  test("the same on either side of the pointer", () => {
    expect(magnification(-40, REACH, GROW)).toBe(magnification(40, REACH, GROW));
  });

  test("halfway out, half the growth", () => {
    expect(magnification(REACH / 2, REACH, GROW)).toBeCloseTo(1 + GROW / 2);
  });

  test("falls off as the pointer moves away", () => {
    const sizes = [0, 20, 40, 60, 80, 100, 120].map((d) => magnification(d, REACH, GROW));
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeLessThan(sizes[i - 1]!);
  });

  test("no reach, or no growth: nothing grows", () => {
    expect(magnification(0, 0, GROW)).toBe(1);
    expect(magnification(0, REACH, 0)).toBe(1);
  });
});
