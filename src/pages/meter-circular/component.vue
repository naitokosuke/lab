<script setup lang="ts">
import { computed, useTemplateRef, watch } from "vue";
import { useCircularAnimate } from "./composable";

interface Props {
  num: number;

  /** @default 100 */
  max?: number;

  /** @default "%" */
  unit?: string;

  /** @default 600 */
  duration?: number;

  /** @default "ease" */
  easing?: string;
}
const props = withDefaults(defineProps<Props>(), {
  max: 100,
  unit: "%",
  duration: 600,
  easing: "ease",
});

const barRef = useTemplateRef<SVGCircleElement>("bar");

const percentage = computed(() => {
  if (props.max <= 0) throw new Error(`[CircularProgress] max must be positive, got ${props.max}`);
  return Math.min(100, Math.max(0, (props.num / props.max) * 100));
});

const strokeRadius = 50 - (20 + 1) / 2;
const circumference = 2 * Math.PI * strokeRadius;

const {
  play,
  pause,
  resume,
  reverse,
  finish,
  cancel,
  pending,
  playState,
  currentTime,
  playbackRate,
} = useCircularAnimate(
  barRef,
  () => circumference,
  () => percentage.value,
  {
    get duration() {
      return props.duration;
    },
    get easing() {
      return props.easing;
    },
  },
);

watch(percentage, () => play());

defineExpose({
  play,
  pause,
  resume,
  reverse,
  finish,
  cancel,
  pending,
  playState,
  currentTime,
  playbackRate,
});
</script>

<template>
  <div class="circular-progress">
    <svg viewBox="0 0 100 100">
      <circle class="border" />
      <circle class="track" />
      <circle ref="bar" class="bar" />
    </svg>
    <div class="label">
      <span class="value">{{ props.num }}</span>
      <span class="unit">{{ props.unit }}</span>
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

  --color-border: #d1d5db;
  --color-track: #fff;
  --color-bar: #22c55e;
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
        stroke-dashoffset: var(--_circumference);
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
      font-size: 24px;
      font-weight: 700;
      color: var(--color-label);
    }

    & .unit {
      font-size: 14px;
      line-height: 1.2;
      letter-spacing: -0.02em;
      color: var(--color-label);
    }
  }
}
</style>
