<script setup lang="ts">
import { ref } from "vue";
import { NKLButton } from "@lab/design/components";
import AudioAnalyzer from "./component.vue";
import { useAudioAnalyser } from "./composable";

const bands = ref(64);
const minDb = ref(-100);
const maxDb = ref(-30);

const {
  graph,
  analysis,
  session,

  fftSizeCtx,
  smoothingCtx,
  toneHzCtx,

  startTone,
  startMicrophone,
  startFile,
} = useAudioAnalyser();

const fftSizeOptions = [256, 512, 1_024, 2_048, 4_096, 8_192, 16_384, 32_768];

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file !== undefined) void startFile(file);
}
</script>

<template>
  <div id="audio-analyzer-lab">
    <h2>Audio Analyzer</h2>

    <section>
      <AudioAnalyzer
        mode="spectrum"
        :frame="analysis.frame.value"
        :sample-rate="graph.sampleRate.value ?? undefined"
        :bands="bands"
        :min-db="minDb"
        :max-db="maxDb"
      />
      <AudioAnalyzer mode="waveform" :frame="analysis.frame.value" />
    </section>

    <output>
      <code>source: {{ session.source.value ?? "none" }}</code>
      <code>sampleRate: {{ graph.sampleRate.value ?? "-" }}</code>
      <code>level: {{ analysis.levelDb.value.toFixed(1) }} dBFS</code>
      <code>peak: {{ session.source.value !== null ? Math.round(analysis.peakHz.value) : "-" }} Hz</code>
      <code v-if="session.error.value !== null" class="error">error: {{ session.error.value }}</code>
    </output>

    <form @submit.prevent>
      <fieldset>
        <legend>Source</legend>
        <menu>
          <NKLButton @click="startTone()">tone</NKLButton>
          <NKLButton @click="startMicrophone()">microphone</NKLButton>
          <NKLButton @click="session.stop()">stop</NKLButton>
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
            :value="toneHzCtx.toneHz.value"
            @input="toneHzCtx.set(($event.target as HTMLInputElement).valueAsNumber)"
          />
          <span>{{ toneHzCtx.toneHz.value }}</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>Analyser</legend>

        <label>
          fftSize
          <select
            :value="fftSizeCtx.fftSize.value"
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
            :value="smoothingCtx.smoothing.value"
            @input="smoothingCtx.set(($event.target as HTMLInputElement).valueAsNumber)"
          />
          <span>{{ smoothingCtx.smoothing.value }}</span>
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
