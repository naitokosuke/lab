<script setup lang="ts">
import { useTemplateRef } from "vue";
import { barBorderWidth, center, circumference, strokeRadius, strokeWidth } from "./core/geometry";

interface Props {
  num: number;
  percentage: number;

  /** @default "%" */
  unit?: string;
}
const { num, percentage, unit = "%" } = defineProps<Props>();

const barRef = useTemplateRef<SVGCircleElement>("bar");

/** The ring's geometry, from the one place the animation reads it too */
const geometry = {
  "--meter-center": `${center}px`,
  "--meter-stroke-width": `${strokeWidth}px`,
  "--meter-bar-border-width": `${barBorderWidth}px`,
  "--meter-stroke-radius": `${strokeRadius}px`,
  "--meter-circumference": `${circumference}px`,
};

defineExpose({ el: barRef });
</script>

<template>
  <div class="circular-progress" :style="{ ...geometry, '--_percentage': percentage }">
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
  /* --meter-center, --meter-stroke-width, --meter-bar-border-width, --meter-stroke-radius and
     --meter-circumference are bound from core/geometry.ts */
  --meter-radius: 70px;
  --meter-value-weight: 700;
  --meter-unit-line-height: 1.2;
  --meter-unit-tracking: -0.02em;

  --color-border: var(--border);
  --color-track: var(--bg);
  --color-bar: var(--accent);
  --color-label: var(--text-h);

  position: relative;
  display: inline-grid;
  place-items: center;
  width: calc(var(--meter-radius) * 2);
  height: calc(var(--meter-radius) * 2);

  & svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);

    & circle {
      cx: var(--meter-center);
      cy: var(--meter-center);
      r: var(--meter-stroke-radius);
      fill: none;

      &.border {
        stroke: var(--color-border);
        stroke-width: calc(var(--meter-stroke-width) + var(--meter-bar-border-width));
      }

      &.track {
        stroke: var(--color-track);
        stroke-width: var(--meter-stroke-width);
      }

      &.bar {
        stroke: var(--color-bar);
        stroke-width: var(--meter-stroke-width);
        stroke-dasharray: var(--meter-circumference);
        stroke-dashoffset: calc(var(--meter-circumference) * (1 - var(--_percentage) / 100));
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
      font-weight: var(--meter-value-weight);
      color: var(--color-label);
    }

    & .unit {
      font-size: var(--text-m);
      line-height: var(--meter-unit-line-height);
      letter-spacing: var(--meter-unit-tracking);
      color: var(--color-label);
    }
  }
}
</style>
