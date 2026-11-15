<script setup lang="ts" generic="V extends string">
import { nextTick, onMounted, useTemplateRef, watch } from "vue";

import { motionVars, useIndicator, type Option } from "./composable";
import { revealScroll } from "./core/reveal";

/**
 * A tab list whose underline slides and stretches to the selected tab, sharing the segmented
 * control's indicator. `duration` (ms) and `easing` drive the underline's morph.
 */
const props = withDefaults(
  defineProps<{
    tabs: readonly Option<V>[];
    modelValue: V;
    label: string;
    duration?: number;
    easing?: string;
  }>(),
  { duration: 350, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
);
const emit = defineEmits<{ "update:modelValue": [value: V] }>();

const list = useTemplateRef<HTMLElement>("list");
const { style, ready } = useIndicator(list, () => [props.modelValue, props.tabs.length]);

/**
 * A row longer than its box scrolls; the chosen tab is brought into it, so the choice is never
 * off to the side. Only the row scrolls, never the page around it.
 */
async function reveal(smooth: boolean) {
  await nextTick();
  const row = list.value;
  if (row === null) return;
  const tab = row.querySelector<HTMLElement>('[aria-selected="true"]');
  if (tab === null) return;
  const to = revealScroll({
    start: tab.offsetLeft,
    size: tab.offsetWidth,
    scroll: row.scrollLeft,
    viewport: row.clientWidth,
    pad: 24,
  });
  if (to === null) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  row.scrollTo({ left: to, behavior: smooth && !reduce ? "smooth" : "auto" });
}
watch(
  () => props.modelValue,
  () => void reveal(true),
);
onMounted(() => void reveal(false));
</script>

<template>
  <div
    ref="list"
    class="tab-list"
    role="tablist"
    :aria-label="label"
    :style="motionVars(duration, easing)"
  >
    <button
      v-for="t in tabs"
      :key="t.value"
      role="tab"
      type="button"
      :aria-selected="t.value === modelValue"
      @click="() => emit('update:modelValue', t.value)"
    >
      {{ t.label }}
    </button>
    <!-- the underline slides and stretches to the selected tab -->
    <span aria-hidden="true" :data-ready="ready || undefined" :style></span>
  </div>
</template>

<style scoped>
.tab-list {
  --duration-swap: 0.28s;
  --tab-list-ease-swap: ease;
  --tab-list-tab-pad-block: 10px;
  --tab-list-tab-pad-inline: 14px;
  --tab-list-label-weight: 700;
  --tab-list-underline-width: 2px;

  position: relative;
  display: flex;
  gap: var(--space-1);
  overflow-x: auto;
  scrollbar-width: none;
  border-block-end: var(--border-width) solid var(--border);

  &::-webkit-scrollbar {
    display: none;
  }

  > button {
    position: relative;
    flex-shrink: 0;
    padding: var(--tab-list-tab-pad-block) var(--tab-list-tab-pad-inline);
    border: 0;
    background: none;
    font: inherit;
    font-size: var(--text-s);
    font-weight: var(--tab-list-label-weight);
    color: var(--text);
    transition: color var(--duration-swap) var(--tab-list-ease-swap);

    &[aria-selected="true"] {
      color: var(--text-h);
    }

    &:focus-visible {
      outline: var(--focus-ring-width) solid var(--accent);
      outline-offset: calc(-1 * var(--focus-ring-offset));
    }
  }

  /* as tall as the tab; only its bottom edge is drawn */
  > span {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    border-block-end: var(--tab-list-underline-width) solid var(--text-h);
    pointer-events: none;

    &[data-ready] {
      transition:
        transform var(--duration-morph) var(--ease-morph),
        width var(--duration-morph) var(--ease-morph);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    > span[data-ready],
    > button {
      transition: none;
    }
  }
}
</style>
