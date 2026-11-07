<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";

import { logBands, normalize } from "./core/spectrum";

interface Props {
  /** What to draw from; `null` draws nothing */
  analyser: AnalyserNode | null;
  mode: "spectrum" | "waveform";

  /** Number of log-spaced bars in spectrum mode @default 64 */
  bands?: number;
  /** Bottom of the spectrum scale, dBFS @default -100 */
  minDb?: number;
  /** Top of the spectrum scale, dBFS @default -30 */
  maxDb?: number;
}
const { analyser, mode, bands = 64, minDb = -100, maxDb = -30 } = defineProps<Props>();

const canvasRef = useTemplateRef<HTMLCanvasElement>("canvas");

let buffer = new Float32Array(0);
let rafId: number | null = null;

function draw() {
  const canvas = canvasRef.value;
  const g = canvas?.getContext("2d");
  if (!canvas || !g) return;
  const { width: w, height: h } = canvas;
  g.clearRect(0, 0, w, h);
  g.fillStyle = g.strokeStyle = getComputedStyle(canvas).color;

  const node = analyser;
  if (!node) {
    g.fillRect(0, h - 1, w, 1);
    return;
  }

  if (mode === "spectrum") {
    if (buffer.length !== node.frequencyBinCount) buffer = new Float32Array(node.frequencyBinCount);
    node.getFloatFrequencyData(buffer);
    const values = logBands(buffer, bands, node.context.sampleRate, node.fftSize);
    const slot = w / values.length;
    const gap = Math.min(2 * devicePixelRatio, slot * 0.2);
    values.forEach((db, i) => {
      const bar = Math.max(1, normalize(db, minDb, maxDb) * h);
      g.fillRect(i * slot, h - bar, slot - gap, bar);
    });
  } else {
    if (buffer.length !== node.fftSize) buffer = new Float32Array(node.fftSize);
    node.getFloatTimeDomainData(buffer);
    g.lineWidth = 1.5 * devicePixelRatio;
    g.beginPath();
    for (let i = 0; i < buffer.length; i++) {
      const x = (i / (buffer.length - 1)) * w;
      const y = ((1 - buffer[i]!) / 2) * h;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }

  rafId = requestAnimationFrame(draw);
}

function restart() {
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
  draw();
}

// keep the backing store at device pixels so lines stay crisp
let resized: ResizeObserver | null = null;
onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  resized = new ResizeObserver(([entry]) => {
    const box = entry!.devicePixelContentBoxSize?.[0];
    canvas.width = box?.inlineSize ?? Math.round(canvas.clientWidth * devicePixelRatio);
    canvas.height = box?.blockSize ?? Math.round(canvas.clientHeight * devicePixelRatio);
    restart();
  });
  resized.observe(canvas);
});
onBeforeUnmount(() => {
  resized?.disconnect();
  if (rafId != null) cancelAnimationFrame(rafId);
});

watch(() => [analyser, mode], restart);
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
