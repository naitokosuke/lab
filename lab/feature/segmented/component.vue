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
  --segmented-ease-swap: ease;
  --segmented-pad: 2px;
  --segmented-pill-radius: 999px;
  --segmented-pill-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
  --segmented-option-height: 32px; /* with the track's pad it is the 36px a thumb is asked to hit */
  --segmented-label-weight: 700;

  position: relative;
  display: inline-flex;
  padding: var(--segmented-pad);
  border-radius: var(--segmented-pill-radius);
  background: var(--accent-bg);
  box-shadow: inset 0 0 0 var(--border-width) var(--border);

  > span {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    border-radius: var(--segmented-pill-radius);
    background: var(--bg);
    box-shadow:
      var(--segmented-pill-shadow),
      0 0 0 var(--border-width) var(--border);
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
    min-height: var(--segmented-option-height);
    padding: 0 var(--space-3);
    border: 0;
    border-radius: var(--segmented-pill-radius);
    background: none;
    font: inherit;
    font-size: var(--text-s);
    font-weight: var(--segmented-label-weight);
    white-space: nowrap;
    color: var(--text);
    transition: color var(--duration-swap) var(--segmented-ease-swap);

    &[aria-checked="true"] {
      color: var(--text-h);
    }

    &:focus-visible {
      outline: var(--focus-ring-width) solid var(--accent);
      outline-offset: var(--focus-ring-offset);
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
