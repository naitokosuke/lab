<script setup lang="ts">
import { ref } from "vue";
import { NKLButton, NKLSelect } from "@lab/design/components";
import {
  ButtonGroup,
  ControlPanel,
  Fieldset,
  FileField,
  RangeField,
  Readout,
} from "../../components";
import AudioAnalyzer from "../../feature/audio-analyzer/component.vue";
import { useAudioAnalyser } from "../../feature/audio-analyzer/composable";

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

const fftSizeOptions = [256, 512, 1_024, 2_048, 4_096, 8_192, 16_384, 32_768].map((n) => ({
  value: String(n),
  label: String(n),
}));
</script>

<template>
  <div id="audio-analyzer-lab">
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

    <Readout class="status" :columns="2">
      <code>source: {{ session.source.value ?? "none" }}</code>
      <code>sampleRate: {{ graph.sampleRate.value ?? "-" }}</code>
      <code>level: {{ analysis.levelDb.value.toFixed(1) }} dBFS</code>
      <code>peak: {{ session.source.value !== null ? Math.round(analysis.peakHz.value) : "-" }} Hz</code>
      <code v-if="session.error.value !== null" class="error">error: {{ session.error.value }}</code>
    </Readout>

    <ControlPanel>
      <Fieldset legend="Source">
        <ButtonGroup>
          <NKLButton @click="startTone()">tone</NKLButton>
          <NKLButton @click="startMicrophone()">microphone</NKLButton>
          <NKLButton @click="session.stop()">stop</NKLButton>
        </ButtonGroup>

        <FileField label="file" accept="audio/*" @select="startFile" />

        <RangeField
          :model-value="toneHzCtx.toneHz.value"
          label="tone (Hz)"
          :min="40"
          :max="2000"
          :step="1"
          @update:model-value="toneHzCtx.set"
        />
      </Fieldset>

      <Fieldset legend="Analyser">
        <NKLSelect
          :model-value="String(fftSizeCtx.fftSize.value)"
          label="fftSize"
          :options="fftSizeOptions"
          @update:model-value="(v) => fftSizeCtx.set(Number(v))"
        />

        <RangeField
          :model-value="smoothingCtx.smoothing.value"
          label="smoothing"
          :min="0"
          :max="0.99"
          :step="0.01"
          @update:model-value="smoothingCtx.set"
        />
      </Fieldset>

      <Fieldset legend="Display">
        <RangeField v-model="bands" label="bands" :min="8" :max="256" :step="8" />
        <RangeField v-model="minDb" label="minDb" :min="-140" :max="-40" :step="5" />
        <RangeField v-model="maxDb" label="maxDb" :min="-60" :max="0" :step="5" />
      </Fieldset>
    </ControlPanel>
  </div>
</template>

<style scoped>
#audio-analyzer-lab {
  .status {
    margin-block-end: var(--space-5);
  }

  --field-value-width: 48px;

  section {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-5) 0;
  }

  /* the error chip spans the whole readout */
  code.error {
    grid-column: 1 / -1;
  }
}
</style>
