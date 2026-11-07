<script setup lang="ts">
import { computed, ref } from "vue";
import { NKLButton } from "@lab/design/components";
import AudioAnalyzer from "./component.vue";
import { useAudioAnalyser } from "./composable";

const bands = ref(64);
const minDb = ref(-100);
const maxDb = ref(-30);

const {
  analyser,

  source,
  error,
  levelDb,
  peakHz,
  sampleRate,

  fftSizeCtx,
  smoothingCtx,
  toneHzCtx,

  startTone,
  startMicrophone,
  startFile,
  stop,
} = useAudioAnalyser();

const live = computed(() => (source.value ? analyser.value : null));

const fftSizeOptions = [256, 512, 1024, 2048, 4096, 8192, 16384, 32768];

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) void startFile(file);
}
</script>

<template>
  <div id="audio-analyzer-lab">
    <h2>Audio Analyzer</h2>

    <section>
      <AudioAnalyzer
        :analyser="live"
        mode="spectrum"
        :bands="bands"
        :min-db="minDb"
        :max-db="maxDb"
      />
      <AudioAnalyzer :analyser="live" mode="waveform" />
    </section>

    <output>
      <code>source: {{ source ?? "none" }}</code>
      <code>sampleRate: {{ sampleRate ?? "-" }}</code>
      <code>level: {{ levelDb.toFixed(1) }} dBFS</code>
      <code>peak: {{ source ? Math.round(peakHz) : "-" }} Hz</code>
      <code v-if="error" class="error">error: {{ error }}</code>
    </output>

    <form @submit.prevent>
      <fieldset>
        <legend>Source</legend>
        <menu>
          <NKLButton @click="startTone()">tone</NKLButton>
          <NKLButton @click="startMicrophone()">microphone</NKLButton>
          <NKLButton @click="stop()">stop</NKLButton>
        </menu>

        <label>
          file
          <input accept="audio/*" type="file" @change="onFile" />
        </label>

        <label>
          tone (Hz)
          <input
            max="2000"
            min="40"
            step="1"
            type="range"
            :value="toneHzCtx.value.value"
            @input="toneHzCtx.set(($event.target as HTMLInputElement).valueAsNumber)"
          />
          <span>{{ toneHzCtx.value.value }}</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>Analyser</legend>

        <label>
          fftSize
          <select
            :value="fftSizeCtx.value.value"
            @change="fftSizeCtx.set(Number(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="n in fftSizeOptions" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>

        <label>
          smoothing
          <input
            max="0.99"
            min="0"
            step="0.01"
            type="range"
            :value="smoothingCtx.value.value"
            @input="smoothingCtx.set(($event.target as HTMLInputElement).valueAsNumber)"
          />
          <span>{{ smoothingCtx.value.value }}</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>Display</legend>

        <label>
          bands
          <input v-model.number="bands" max="256" min="8" step="8" type="range" />
          <span>{{ bands }}</span>
        </label>

        <label>
          minDb
          <input v-model.number="minDb" max="-40" min="-140" step="5" type="range" />
          <span>{{ minDb }}</span>
        </label>

        <label>
          maxDb
          <input v-model.number="maxDb" max="0" min="-60" step="5" type="range" />
          <span>{{ maxDb }}</span>
        </label>
      </fieldset>
    </form>
  </div>
</template>

<style scoped>
#audio-analyzer-lab {
  padding: var(--space-6) var(--space-5);
  max-width: 640px;
  margin: 0 auto;

  section {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-5) 0;
  }

  output {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
    margin-bottom: var(--space-5);

    code {
      font-size: var(--text-xs);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-s);
      background: var(--accent-bg);
      color: var(--accent);
      font-variant-numeric: tabular-nums;

      &.error {
        grid-column: 1 / -1;
      }
    }
  }

  form {
    display: grid;
    gap: var(--space-4);

    fieldset {
      display: grid;
      gap: var(--space-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-l);
      padding: var(--space-4);
    }

    legend {
      font-size: var(--text-m);
      font-weight: 600;
      color: var(--text-h);
      padding: 0 var(--space-2);
    }

    label {
      display: grid;
      grid-template-columns: 100px 1fr 48px;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-m);
      color: var(--text);
      font-variant-numeric: tabular-nums;
    }

    input[type="file"],
    select {
      grid-column: span 2;
      font-size: var(--text-m);
      padding: var(--space-1) var(--space-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-s);
      background: var(--bg);
      color: var(--text-h);
    }

    menu {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: var(--space-2);
      margin: 0;
      padding: 0;
    }
  }
}
</style>
