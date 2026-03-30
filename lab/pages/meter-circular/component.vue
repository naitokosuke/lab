<script setup lang="ts">
import { useTemplateRef } from "vue";

interface Props {
  num: number;
  percentage: number;

  /** @default "%" */
  unit?: string;
}
const { num, percentage, unit = "%" } = defineProps<Props>();

const barRef = useTemplateRef<SVGCircleElement>("bar");

defineExpose({ el: barRef });
</script>

<template>
  <div class="circular-progress" :style="{ '--_percentage': percentage }">
    <svg viewBox="0 0 100 100">
      <circle class="border" />
      <circle class="track" />
      <circle ref="bar" class="bar" />
    </svg>
    <div class="label">
      <span class="value">{{ num }}</span>
      <span class="unit">{{ unit }}</span>
    </div>
  </div>
</template>

<style scoped>
.circular-progress {
  --radius: 70px;
  --stroke-width: 20px;
  --bar-border-width: 1px;
  --center: 50px;

  --_stroke-radius: calc(var(--center) - (var(--stroke-width) + var(--bar-border-width)) / 2);
  --_circumference: calc(2 * 3.14159265 * var(--_stroke-radius));

  --color-border: var(--border);
  --color-track: var(--bg);
  --color-bar: var(--accent);
  --color-label: var(--text-h);

  position: relative;
  display: inline-grid;
  place-items: center;
  width: calc(var(--radius) * 2);
  height: calc(var(--radius) * 2);

  & svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);

    & circle {
      cx: var(--center);
      cy: var(--center);
      r: var(--_stroke-radius);
      fill: none;

      &.border {
        stroke: var(--color-border);
        stroke-width: calc(var(--stroke-width) + var(--bar-border-width));
      }

      &.track {
        stroke: var(--color-track);
        stroke-width: var(--stroke-width);
      }

      &.bar {
        stroke: var(--color-bar);
        stroke-width: var(--stroke-width);
        stroke-dasharray: var(--_circumference);
        stroke-dashoffset: calc(var(--_circumference) * (1 - var(--_percentage) / 100));
      }
    }
  }

  & .label {
    position: absolute;
    display: grid;
    grid-auto-flow: column;
    align-items: end;
    justify-items: center;

    & .value {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-label);
    }

    & .unit {
      font-size: var(--text-m);
      line-height: 1.2;
      letter-spacing: -0.02em;
      color: var(--color-label);
    }
  }
}
</style>
