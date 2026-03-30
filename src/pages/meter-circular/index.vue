<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import CircularProgress from "./component.vue";
import { useCircularAnimate } from "./composable";

definePage({
  meta: {
    title: "Meter Circular",
    description: "SVG ベースの円形メーター",
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
  reverse,
  finish,
  cancel,
  pending,
  playState,
  currentTimeCtx,
  playbackRateCtx,
} = useCircularAnimate(
  barRef,
  () => circumference,
  () => percentage.value,
  {
    get duration() {
      return duration.value;
    },
    get easing() {
      return easing.value;
    },
  },
);

watch(percentage, () => play());

const easingOptions = ["ease", "ease-in", "ease-out", "ease-in-out", "linear"];

function setPlaybackRate(value: number) {
  playbackRateInput.value = value;
  playbackRateCtx.set(value);
}
</script>

<template>
  <div class="page">
    <h2>Meter Circular</h2>

    <div class="demo">
      <CircularProgress ref="progress" :num="num" :percentage="percentage" :unit="unit" />
    </div>

    <!-- State -->
    <div class="state">
      <code>playState: {{ playState }}</code>
      <code>pending: {{ pending }}</code>
      <code
        >currentTime:
        {{
          currentTimeCtx.value.value != null ? Math.round(Number(currentTimeCtx.value.value)) : null
        }}</code
      >
      <code>playbackRate: {{ playbackRateCtx.value.value }}</code>
    </div>

    <!-- Controls -->
    <div class="controls">
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
        <div class="actions">
          <button @click="play()">play()</button>
          <button @click="pause()">pause()</button>
          <button @click="resume()">resume()</button>
          <button @click="reverse()">reverse()</button>
          <button @click="finish()">finish()</button>
          <button @click="cancel()">cancel()</button>
        </div>
      </fieldset>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 32px 24px;
  max-width: 480px;
  margin: 0 auto;
}

.demo {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}

.state {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 24px;
}

.state code {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--accent-bg);
  color: var(--accent);
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.controls fieldset {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}

.controls legend {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-h);
  padding: 0 8px;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  font-size: 14px;
  color: var(--text);
  margin-bottom: 8px;
}

.controls label:last-child {
  margin-bottom: 0;
}

.controls input[type="range"] {
  flex: 1;
}

.controls input[type="number"],
.controls input[type="text"],
.controls select {
  flex: 1;
  font-size: 14px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  color: var(--text-h);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.actions button {
  font-family: var(--mono);
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--accent-bg);
  color: var(--accent);
  cursor: pointer;
}
</style>
