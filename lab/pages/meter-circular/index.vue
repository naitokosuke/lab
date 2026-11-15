<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { NKLButton, NKLSelect } from "@lab/design/components";
import {
  ButtonGroup,
  ControlPanel,
  Fieldset,
  NumberField,
  RangeField,
  Readout,
  TextField,
} from "../../components";
import MeterCircular from "../../feature/meter-circular/component.vue";
import { useCircularAnimate } from "../../feature/meter-circular/composable";
import { circumference } from "../../feature/meter-circular/core/geometry";

const num = ref(72);
const max = ref(100);
const unit = ref("%");
const duration = ref(600);
const easing = ref("ease");
const playbackRateInput = ref(1);

const progressRef = useTemplateRef<InstanceType<typeof MeterCircular>>("progress");
const barRef = computed(() => progressRef.value?.el ?? null);

const percentage = computed(() => {
  if (max.value <= 0) throw new Error(`[MeterCircular] max must be positive, got ${max.value}`);
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
} = useCircularAnimate(barRef, circumference, percentage, duration, easing);

const easingOptions = ["ease", "ease-in", "ease-out", "ease-in-out", "linear"].map((e) => ({
  value: e,
  label: e,
}));

function setPlaybackRate(value: number) {
  playbackRateInput.value = value;
  playbackRateCtx.set(value);
}
</script>

<template>
  <div id="meter-circular-lab">
    <section>
      <MeterCircular ref="progress" :num="num" :percentage="percentage" :unit="unit" />
    </section>

    <Readout class="status" :columns="2">
      <code>playState: {{ playState }}</code>
      <code>pending: {{ pending }}</code>
      <code>currentTime:
        {{
          currentTimeCtx.currentTime.value != null ? Math.round(Number(currentTimeCtx.currentTime.value)) : null
        }}</code>
      <code>playbackRate: {{ playbackRateCtx.playbackRate.value }}</code>
    </Readout>

    <ControlPanel>
      <Fieldset legend="Props">
        <RangeField v-model="num" label="num" :min="0" :max="max" />

        <NumberField v-model="max" label="max" :min="1" />
        <TextField v-model="unit" label="unit" />
        <RangeField v-model="duration" label="duration (ms)" :min="100" :max="3000" :step="100" />
        <NKLSelect v-model="easing" label="easing" :options="easingOptions" />

        <RangeField
          v-model="playbackRateInput"
          label="playbackRate"
          :min="0.1"
          :max="5"
          :step="0.1"
          :value="`${playbackRateInput}x`"
          @update:model-value="setPlaybackRate"
        />
      </Fieldset>

      <Fieldset legend="ButtonGroup">
        <ButtonGroup>
          <NKLButton @click="play()">play()</NKLButton>
          <NKLButton @click="pause()">pause()</NKLButton>
          <NKLButton @click="resume()">resume()</NKLButton>

          <NKLButton @click="finish()">finish()</NKLButton>
          <NKLButton @click="cancel()">cancel()</NKLButton>
        </ButtonGroup>
      </Fieldset>
    </ControlPanel>
  </div>
</template>

<style scoped>
#meter-circular-lab {
  .status {
    margin-block-end: var(--space-5);
  }

  section {
    display: grid;
    justify-items: center;
    padding: var(--space-6) 0;
  }
}
</style>
