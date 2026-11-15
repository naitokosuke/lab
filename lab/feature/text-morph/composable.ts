import { nextTick, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";

import { align, flatten, type Glyph, type MorphPart } from "./core/glyphs";

export type MorphStats = { kept: number; entered: number; left: number };

/**
 * FLIP for text: when `parts` change, the characters the old and new text share stay and
 * slide to their new place, the others fade out where they were and in where they go.
 * `root` holds the glyph spans (`[data-g]`), `exits` is where the leaving ones' ghosts go.
 * Under reduced motion (or a zero duration) the text simply changes.
 */
export function useTextMorph(
  root: Readonly<Ref<HTMLElement | null>>,
  exits: Readonly<Ref<HTMLElement | null>>,
  parts: () => readonly MorphPart[],
  options: { duration: MaybeRefOrGetter<number>; easing: MaybeRefOrGetter<string> },
) {
  let last = 0;
  const mint = () => ++last;
  const glyphs = shallowRef<Glyph[]>(align([], flatten(parts()), mint));
  const stats = shallowRef<MorphStats>({ kept: 0, entered: glyphs.value.length, left: 0 });

  const glyphEls = () => [...(root.value?.querySelectorAll<HTMLElement>("[data-g]") ?? [])];

  watch(
    () =>
      parts()
        .map((p) => `${p.tone ?? ""}\u0000${p.text}`)
        .join("\u0001"),
    async () => {
      const prev = glyphs.value;
      const next = align(prev, flatten(parts()), mint);
      const staying = new Set(next.map((g) => g.id));
      const keptCount = prev.filter((g) => staying.has(g.id)).length;
      stats.value = {
        kept: keptCount,
        entered: next.length - keptCount,
        left: prev.length - keptCount,
      };

      const el = root.value;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reduce ? 0 : toValue(options.duration);
      if (!el || !(duration > 0)) {
        glyphs.value = next;
        return;
      }
      const easing = toValue(options.easing);

      // where every character is now
      const before = new Map<number, { x: number; y: number }>();
      for (const g of glyphEls())
        before.set(Number(g.dataset.g), { x: g.offsetLeft, y: g.offsetTop });

      // the leaving ones: a copy stays where it was and fades, outside the list Vue keeps
      for (const g of glyphEls()) {
        if (staying.has(Number(g.dataset.g))) continue;
        const ghost = g.cloneNode(true) as HTMLElement;
        ghost.removeAttribute("data-g");
        ghost.style.cssText = `position:absolute;left:${g.offsetLeft}px;top:${g.offsetTop}px`;
        exits.value?.append(ghost);
        void ghost
          .animate(
            [
              { opacity: 1, filter: "blur(0)", transform: "none" },
              { opacity: 0, filter: "blur(3px)", transform: "translateY(-0.3em)" },
            ],
            { duration, easing },
          )
          .finished.finally(() => ghost.remove());
      }

      glyphs.value = next;
      await nextTick();

      for (const g of glyphEls()) {
        const was = before.get(Number(g.dataset.g));
        if (was) {
          const dx = was.x - g.offsetLeft;
          const dy = was.y - g.offsetTop;
          if (dx !== 0 || dy !== 0)
            g.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
              duration,
              easing,
            });
        } else {
          g.animate(
            [
              { opacity: 0, filter: "blur(3px)", transform: "translateY(0.3em)" },
              { opacity: 1, filter: "blur(0)", transform: "none" },
            ],
            { duration, easing, fill: "backwards" },
          );
        }
      }
    },
  );

  return { glyphs, stats };
}
