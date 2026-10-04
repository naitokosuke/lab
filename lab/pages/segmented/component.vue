<script setup lang="ts" generic="V extends string">
import { useTemplateRef } from "vue";

import { motionVars, useIndicator, type Option } from "./composable";

/**
 * A segmented control: one radio per option, and a pill under the chosen one that slides and
 * stretches to the next choice. `duration` (ms) and `easing` drive the pill's morph.
 */
const props = withDefaults(
  defineProps<{
    options: readonly Option<V>[];
    modelValue: V;
    label: string;
    duration?: number;
    easing?: string;
  }>(),
  { duration: 350, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
);
const emit = defineEmits<{ "update:modelValue": [value: V] }>();

const list = useTemplateRef<HTMLElement>("list");
const { style, ready } = useIndicator(list, () => [props.modelValue, props.options.length]);
</script>

<template>
  <div
    ref="list"
    class="segmented"
    role="radiogroup"
    :aria-label="label"
    :style="motionVars(duration, easing)"
  >
    <!-- the chosen option's pill, sliding under the labels -->
    <span aria-hidden="true" :data-ready="ready || undefined" :style></span>
    <button
      v-for="o in options"
      :key="o.value"
      role="radio"
      type="button"
      :aria-checked="o.value === modelValue"
      @click="() => emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<style scoped>
.segmented {
  --duration-swap: 0.28s;

  position: relative;
  display: inline-flex;
  padding: 2px;
  border-radius: 999px;
  background: var(--accent-bg);
  box-shadow: inset 0 0 0 1px var(--border);

  > span {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    border-radius: 999px;
    background: var(--bg);
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.08),
      0 0 0 1px var(--border);
    pointer-events: none;

    /* placed before it moves: it appears where it belongs instead of sliding in from the corner */
    &[data-ready] {
      transition:
        transform var(--duration-morph) var(--ease-morph),
        width var(--duration-morph) var(--ease-morph);
    }
  }

  > button {
    position: relative;
    min-height: 32px; /* with the track's 2px it is the 36px a thumb is asked to hit */
    padding: 0 12px;
    border: 0;
    border-radius: 999px;
    background: none;
    font: inherit;
    font-size: var(--text-s);
    font-weight: 700;
    white-space: nowrap;
    color: var(--text);
    transition: color var(--duration-swap) ease;

    &[aria-checked="true"] {
      color: var(--text-h);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    @media (hover: hover) {
      &:not([aria-checked="true"]):hover {
        color: var(--text-h);
      }
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
