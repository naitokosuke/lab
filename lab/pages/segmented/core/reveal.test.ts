import { describe, expect, test } from "vite-plus/test";

import { revealScroll } from "./reveal";

const row = { scroll: 0, viewport: 300, pad: 24 };

describe("revealScroll", () => {
  test("a tab already in view leaves the row where it is", () => {
    expect(revealScroll({ ...row, start: 100, size: 80 })).toBeNull();
  });

  test("a tab off to the right is brought to the right edge, with its padding", () => {
    // 400 + 80 + 24 - 300
    expect(revealScroll({ ...row, start: 400, size: 80 })).toBe(204);
  });

  test("a tab off to the left is brought to the left edge, with its padding", () => {
    expect(revealScroll({ ...row, scroll: 500, start: 120, size: 80 })).toBe(96);
  });

  test("a tab inside the view but within the padding still nudges the row", () => {
    // its right edge is 290, inside 300, but 290 + 24 is not
    expect(revealScroll({ ...row, start: 210, size: 80 })).toBe(14);
  });
});
