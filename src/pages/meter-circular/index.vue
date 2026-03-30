<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import CircularProgress from "./component.vue";
import { useCircularAnimate } from "./composable";

definePage({
  meta: {
    title: "Meter Circular",
    description: "SVG-based circular meter",
    tags: ["svg", "animation"],
  },
});

const num = ref(72);
const max = ref(100);
const unit = ref("%");
const duration = ref(600);
const easing = ref("ease");
const playbackRateInput = ref(1);

const progressRef = useTemplateRef<InstanceType<typeof CircularProgress>>("progress");
const barRef = computed(() => progressRef.value?.el ?? null);

const strokeRadius = 50 - (20 + 1) / 2;
const circumference = 2 * Math.PI * strokeRadius;

const percentage = computed(() => {
  if (max.value <= 0) throw new Error(`[CircularProgress] max must be positive, got ${max.value}`);
  return Math.min(100, Math.max(0, (num.value / max.value) * 100));
});

const {
  play,
  pause,
  resume,
  finish,
  cancel,

  pending,
  playState,
  currentTimeCtx,
  playbackRateCtx,
} = useCircularAnimate(
  barRef,
  circumference,
  percentage,
  duration,
  easing,
);

const easingOptions = ["ease", "ease-in", "ease-out", "ease-in-out", "linear"];

function setPlaybackRate(value: number) {
  playbackRateInput.value = value;
  playbackRateCtx.set(value);
}
</script>

<template>
  <div id="meter-circular-lab">
    <h2>Meter Circular</h2>

    <section>
      <CircularProgress ref="progress" :num="num" :percentage="percentage" :unit="unit" />
    </section>

    <output>
      <code>playState: {{ playState }}</code>
      <code>pending: {{ pending }}</code>
      <code
        >currentTime:
        {{
          currentTimeCtx.value.value != null ? Math.round(Number(currentTimeCtx.value.value)) : null
        }}</code
      >
      <code>playbackRate: {{ playbackRateCtx.value.value }}</code>
    </output>

    <form @submit.prevent>
      <fieldset>
        <legend>Props</legend>

        <label>
          num
          <input v-model.number="num" type="range" min="0" :max="max" />
          <span>{{ num }}</span>
        </label>

        <label>
          max
          <input v-model.number="max" type="number" min="1" />
        </label>

        <label>
          unit
          <input v-model="unit" type="text" />
        </label>

        <label>
          duration (ms)
          <input v-model.number="duration" type="range" min="100" max="3000" step="100" />
          <span>{{ duration }}</span>
        </label>

        <label>
          easing
          <select v-model="easing">
            <option v-for="opt in easingOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>

        <label>
          playbackRate
          <input
            v-model.number="playbackRateInput"
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            @input="setPlaybackRate(playbackRateInput)"
          />
          <span>{{ playbackRateInput }}x</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>Actions</legend>
        <menu>
          <button @click="play()">play()</button>
          <button @click="pause()">pause()</button>
          <button @click="resume()">resume()</button>

          <button @click="finish()">finish()</button>
          <button @click="cancel()">cancel()</button>
        </menu>
      </fieldset>
    </form>
  </div>
</template>

<style scoped>
#meter-circular-lab {
  padding: 32px 24px;
  max-width: 480px;
  margin: 0 auto;

  section {
    display: grid;
    justify-items: center;
    padding: 32px 0;
  }

  output {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 24px;

    code {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--accent-bg);
      color: var(--accent);
      font-variant-numeric: tabular-nums;
    }
  }

  form {
    display: grid;
    gap: 16px;

    fieldset {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
    }

    legend {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-h);
      padding: 0 8px;
    }

    label {
      display: grid;
      grid-template-columns: 100px 1fr 40px;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--text);
      margin-bottom: 8px;
      font-variant-numeric: tabular-nums;

      &:last-child {
        margin-bottom: 0;
      }
    }

    input[type="number"],
    input[type="text"],
    select {
      font-size: 14px;
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg);
      color: var(--text-h);
    }

    menu {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;

      button {
        font-family: var(--mono);
        font-size: 13px;
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid var(--border);
        background: var(--accent-bg);
        color: var(--accent);
      }
    }
  }
}
</style>
