<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";

import type { AnalysisFrame } from "./composable";
import { logBands, normalize } from "./core/spectrum";
import type { Hz } from "./core/units";
import { dbfs } from "./core/units";

interface Props {
  mode: "spectrum" | "waveform";
  /** The latest frame, drawn whenever a new one arrives; `null` draws a flat line */
  frame: AnalysisFrame | null;

  /** Sample rate behind `frame`, to place spectrum bins on the frequency axis */
  sampleRate?: Hz;
  /** Number of log-spaced bars in spectrum mode @default 64 */
  bands?: number;
  /** Bottom of the spectrum scale, dBFS @default -100 */
  minDb?: number;
  /** Top of the spectrum scale, dBFS @default -30 */
  maxDb?: number;
}
const {
  mode,
  frame,
  sampleRate,
  bands = 64,
  minDb = -100,
  maxDb = -30,
} = defineProps<Props>();

const canvasRef = useTemplateRef<HTMLCanvasElement>("canvas");

function draw() {
  const canvas = canvasRef.value;
  if (canvas === null) return;
  const g = canvas.getContext("2d");
  if (g === null) return;
  const { width: w, height: h } = canvas;
  g.clearRect(0, 0, w, h);
  g.fillStyle = g.strokeStyle = getComputedStyle(canvas).color;

  if (frame === null) {
    g.fillRect(0, h - 1, w, 1);
    return;
  }

  if (mode === "spectrum") {
    if (sampleRate === undefined) return;
    const { spectrum, waveform } = frame;
    const values = logBands(spectrum, bands, sampleRate, waveform.length);
    const slot = w / values.length;
    const gap = Math.min(2 * devicePixelRatio, slot * 0.2);
    values.forEach((db, i) => {
      const bar = Math.max(1, normalize(db, dbfs(minDb), dbfs(maxDb)) * h);
      g.fillRect(i * slot, h - bar, slot - gap, bar);
    });
  } else {
    const { waveform } = frame;
    g.lineWidth = 1.5 * devicePixelRatio;
    g.beginPath();
    for (let i = 0; i < waveform.length; i++) {
      const x = (i / (waveform.length - 1)) * w;
      const y = ((1 - waveform[i]!) / 2) * h;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
}

watch(() => [frame, mode, sampleRate, bands, minDb, maxDb], draw);

// keep the backing store at device pixels so lines stay crisp
let resized: ResizeObserver | null = null;
onMounted(() => {
  const canvas = canvasRef.value;
  if (canvas === null) return;
  resized = new ResizeObserver(([entry]) => {
    const box = entry!.devicePixelContentBoxSize?.[0];
    canvas.width = box?.inlineSize ?? Math.round(canvas.clientWidth * devicePixelRatio);
    canvas.height = box?.blockSize ?? Math.round(canvas.clientHeight * devicePixelRatio);
    draw();
  });
  resized.observe(canvas);
});
onBeforeUnmount(() => resized?.disconnect());
</script>

<template>
  <canvas ref="canvas" class="audio-analyzer" role="img" :aria-label="`Audio ${mode}`" />
</template>

<style scoped>
.audio-analyzer {
  --color-bar: var(--accent);
  --color-bg: var(--accent-bg);

  display: block;
  inline-size: 100%;
  block-size: 160px;
  color: var(--color-bar);
  background: var(--color-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-l);
}
</style>
