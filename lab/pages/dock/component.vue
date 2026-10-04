<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useDock } from "./composable";

/**
 * A menu: a pane of glass floating at the bottom middle of its stage (its nearest positioned
 * ancestor; with `fixed`, the viewport's). Under the item that is open (`current`) sits one
 * dot, and only the dot moves: it slides to the next one. It holds `DockItem`s, `DockGroup`s
 * of them that fold away, and `DockDivider`s.
 *
 * Under a mouse it magnifies like a dock: the icons near the pointer grow, the nearest the
 * most (`1 + grow`), and push their neighbours aside, out to `reach` px from the pointer; they
 * grow upward, out of the glass, so the dock itself keeps its height.
 *
 * `away` sinks it below its stage's edge (while something covers the views, a sheet), and
 * brings it back up after.
 */
const props = withDefaults(
  defineProps<{ label: string; away?: boolean; reach?: number; grow?: number; fixed?: boolean }>(),
  { away: false, reach: 120, grow: 0.55, fixed: false },
);
defineSlots<{ default(): unknown }>();

const nav = useTemplateRef<HTMLElement>("nav");
const { dot, dotReady, onEnter, onMove, onLeave } = useDock(nav, {
  reach: () => props.reach,
  grow: () => props.grow,
});
</script>

<template>
  <nav
    ref="nav"
    data-dock
    :aria-label="label"
    :data-away="away || undefined"
    :data-fixed="fixed || undefined"
    :inert="away"
    @pointerenter="onEnter"
    @pointermove="onMove"
    @pointerleave="onLeave"
  >
    <slot></slot>
    <span
      aria-hidden="true"
      class="dot"
      :data-ready="dotReady || undefined"
      :data-shown="dot !== null || undefined"
      :style="dot === null ? undefined : `--x: ${dot}px`"
    ></span>
  </nav>
</template>

<style scoped>
nav {
  /*
   * The dock's own tokens, read by its items, groups and dividers too. Ink, muted and line
   * follow the lab's (which follow the device's light or dark); the glass and its shadow are
   * a light and a dark pair.
   */
  color-scheme: light dark;
  --dock-ink: var(--text-h);
  --dock-muted: var(--text);
  --dock-line: var(--border);
  --dock-on-ink: var(--bg);
  --dock-wash: color-mix(in oklch, var(--dock-ink) 8%, transparent);
  --dock-glass: light-dark(rgb(255 255 255 / 0.72), oklch(0.26 0.005 260 / 0.72));
  --dock-shadow:
    0 2px 6px light-dark(rgb(17 19 24 / 0.06), rgb(0 0 0 / 0.3)),
    0 12px 28px light-dark(rgb(17 19 24 / 0.14), rgb(0 0 0 / 0.45));
  --dock-height: 60px;
  --dock-gap: 12px;
  --dock-ease-morph: cubic-bezier(0.22, 1, 0.36, 1);
  /* a spring with one small overshoot: the icons, let go */
  --dock-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --dock-duration-morph: 0.35s;
  --dock-duration-swap: 0.28s;
  /* following the pointer closely, and a name showing */
  --dock-duration-follow: 0.1s;
  --dock-duration-tip: 0.15s;
  /* an icon's cell at rest; `--m` (per item) is how much it has grown under the pointer */
  --cell: 40px;

  @media (width >= 680px) {
    --cell: 44px;
  }

  @media (prefers-reduced-motion: reduce) {
    --dock-duration-morph: 0s;
    --dock-duration-swap: 0s;
    --dock-duration-follow: 0s;
    --dock-duration-tip: 0s;
  }

  position: absolute;
  /* centred by its margins, so its whole width is the stage's, not half of it */
  inset-inline: 0;
  margin-inline: auto;
  width: fit-content;
  inset-block-end: var(--dock-gap);
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: var(--dock-height);
  max-width: calc(100% - 16px);
  padding: 0 8px;
  border-radius: 22px;
  background: var(--dock-glass);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  /* a hairline, and a lit top edge as glass has */
  box-shadow:
    inset 0 0 0 1px color-mix(in oklch, var(--dock-line) 80%, transparent),
    inset 0 1px 0 light-dark(rgb(255 255 255 / 0.9), rgb(255 255 255 / 0.08)),
    var(--dock-shadow);
  transition:
    translate var(--dock-duration-morph) var(--dock-ease-morph),
    opacity var(--dock-duration-swap) ease;

  /*
   * How an icon's growth moves: springing back once the pointer has left, following it closely
   * while it is over the dock. Set here and read by the items, as the items' own styles cannot
   * see the dock's state across component scopes.
   */
  --dock-grow-duration: var(--dock-duration-morph);
  --dock-grow-ease: var(--dock-ease-spring);

  &[data-magnify] {
    --dock-grow-duration: var(--dock-duration-follow);
    --dock-grow-ease: ease-out;
  }

  &[data-fixed] {
    position: fixed;
    inset-block-end: calc(env(safe-area-inset-bottom, 0px) + var(--dock-gap));
    max-width: calc(100vw - 16px);
  }

  /* what is open: one dot under it, sliding to the next */
  > .dot {
    position: absolute;
    inset-inline-start: 0;
    inset-block-end: 5px;
    width: 4px;
    height: 4px;
    margin-inline-start: -2px;
    border-radius: 50%;
    background: var(--dock-ink);
    translate: var(--x, 0) 0;
    opacity: 0;
    pointer-events: none;

    &[data-shown] {
      opacity: 1;
    }

    &[data-ready] {
      transition:
        translate var(--dock-duration-morph) var(--dock-ease-morph),
        opacity var(--dock-duration-swap) ease;
    }
  }

  &[data-away] {
    translate: 0 calc(100% + var(--dock-gap));
    opacity: 0;
  }

  &[data-away][data-fixed] {
    translate: 0 calc(100% + var(--dock-gap) + env(safe-area-inset-bottom, 0px));
  }
}
</style>
