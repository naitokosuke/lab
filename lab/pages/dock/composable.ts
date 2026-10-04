import { onBeforeUnmount, onMounted, ref, toValue, type MaybeRefOrGetter, type Ref } from "vue";

import { magnification } from "./core/magnify";

/**
 * The dock's two motions. Under a mouse it magnifies: each item in `nav` (`[data-dock-item]`,
 * not folded away in a `[data-closed]` group) gets `--m`, how much it has grown, from its
 * distance to the pointer. Distances are from where each item rests, measured as the pointer
 * comes in before anything has grown, so the row does not chase its own growth. And it keeps
 * `dot`, the x of the middle of the open item (`aria-current="page"`), for one dot to slide to.
 */
export function useDock(
  nav: Readonly<Ref<HTMLElement | null>>,
  options: { reach: MaybeRefOrGetter<number>; grow: MaybeRefOrGetter<number> },
) {
  const items = () =>
    [...(nav.value?.querySelectorAll<HTMLElement>("[data-dock-item]") ?? [])].filter(
      (el) => el.closest("[data-closed]") === null,
    );
  /** Where each icon rests, measured as the pointer comes in, before anything has grown */
  let rest: { el: HTMLElement; x: number }[] = [];
  let pointer: number | null = null;
  let frame = 0;

  function magnify() {
    frame = 0;
    const reach = toValue(options.reach);
    const grow = toValue(options.grow);
    for (const { el, x } of rest) {
      if (pointer === null) el.style.removeProperty("--m");
      else el.style.setProperty("--m", magnification(pointer - x, reach, grow).toFixed(3));
    }
    placeDot();
  }
  const schedule = () => {
    if (frame === 0) frame = requestAnimationFrame(magnify);
  };

  /**
   * Where the dot is: under the middle of the open item, or nowhere when none is open (or it
   * is folded away). Placed once before it may slide, so it appears in place rather than
   * flying in.
   */
  const dot = ref<number | null>(null);
  const dotReady = ref(false);
  function placeDot() {
    const n = nav.value;
    const el = n?.querySelector<HTMLElement>('[data-dock-item][aria-current="page"]');
    if (!n || !el || el.closest("[data-closed]") !== null) {
      dot.value = null;
      return;
    }
    const a = n.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    dot.value = b.left - a.left + b.width / 2;
    if (!dotReady.value) requestAnimationFrame(() => (dotReady.value = true));
  }

  // what moves the dot: another item opening, a group folding, the dock's width changing
  let watchers: { disconnect(): void }[] = [];
  onMounted(() => {
    const n = nav.value;
    if (!n) return;
    const changed = new MutationObserver(placeDot);
    changed.observe(n, { subtree: true, attributeFilter: ["aria-current", "data-closed"] });
    const resized = new ResizeObserver(placeDot);
    resized.observe(n);
    watchers = [changed, resized];
    placeDot();
  });
  onBeforeUnmount(() => {
    watchers.forEach((w) => w.disconnect());
    if (frame !== 0) cancelAnimationFrame(frame);
  });

  function onEnter(e: PointerEvent) {
    if (e.pointerType !== "mouse") return;
    rest = items().map((el) => {
      const r = el.getBoundingClientRect();
      return { el, x: r.left + r.width / 2 };
    });
    nav.value?.setAttribute("data-magnify", "");
  }
  function onMove(e: PointerEvent) {
    if (e.pointerType !== "mouse" || rest.length === 0) return;
    pointer = e.clientX;
    schedule();
  }
  function onLeave() {
    pointer = null;
    nav.value?.removeAttribute("data-magnify");
    schedule();
  }

  return { dot, dotReady, onEnter, onMove, onLeave };
}
