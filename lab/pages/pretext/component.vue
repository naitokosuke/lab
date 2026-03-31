<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef } from "vue";
import {
  createSimulation,
  stepSimulation,
  ROWS,
  LINE_HEIGHT,
  TARGET_ROW_W,
  CANVAS_W,
  CANVAS_H,
  FONT_SIZE,
  PROP_FAMILY,
  type FrameResult,
} from "./composable";

const sourceCanvasRef = ref<HTMLElement>();
const monoRowRefs = ref<HTMLDivElement[]>([]);
const propRowRefs = ref<HTMLDivElement[]>([]);
const rowIndices = Array.from({ length: ROWS }, (_, i) => i);

const mode = ref<"prop" | "mono" | "source">("prop");
const sim = shallowRef<ReturnType<typeof createSimulation>>();
let animId = 0;

function render(now: number) {
  if (!sim.value) return;
  const result: FrameResult = stepSimulation(sim.value, now);

  for (let i = 0; i < ROWS; i++) {
    const monoEl = monoRowRefs.value[i];
    const propEl = propRowRefs.value[i];
    if (monoEl) monoEl.textContent = result.rows[i]!.monoText;
    if (propEl) propEl.innerHTML = result.rows[i]!.propHtml;
  }

  animId = requestAnimationFrame(render);
}

onMounted(() => {
  const s = createSimulation();
  sim.value = s;
  if (sourceCanvasRef.value) {
    sourceCanvasRef.value.appendChild(s.simulationCanvas);
    s.simulationCanvas.className = "source-canvas";
  }
  animId = requestAnimationFrame(render);
});

onUnmounted(() => {
  cancelAnimationFrame(animId);
});
</script>

<template>
  <div class="typo-ascii">
    <div class="controls">
      <span class="title">Typographic ASCII Art</span>
      <span class="sep">—</span>
      <span class="desc"
        >pretext measures each glyph's pixel width to pick the best proportional character</span
      >
      <div class="mode-switch">
        <button :class="{ active: mode === 'prop' }" @click="mode = 'prop'">Proportional</button>
        <button :class="{ active: mode === 'mono' }" @click="mode = 'mono'">Monospace</button>
        <button :class="{ active: mode === 'source' }" @click="mode = 'source'">Source</button>
      </div>
    </div>

    <div class="display-area">
      <div v-show="mode === 'prop'" class="art-box prop-box">
        <div
          v-for="i in rowIndices"
          :key="'p' + i"
          :ref="
            (el) => {
              if (el) propRowRefs[i] = el as HTMLDivElement;
            }
          "
          class="art-row"
          :style="{ height: LINE_HEIGHT + 'px', lineHeight: LINE_HEIGHT + 'px' }"
        />
      </div>

      <div v-show="mode === 'mono'" class="art-box mono-box">
        <div
          v-for="i in rowIndices"
          :key="'m' + i"
          :ref="
            (el) => {
              if (el) monoRowRefs[i] = el as HTMLDivElement;
            }
          "
          class="art-row"
          :style="{ height: LINE_HEIGHT + 'px', lineHeight: LINE_HEIGHT + 'px' }"
        />
      </div>

      <div v-show="mode === 'source'" ref="sourceCanvasRef" class="source-box" />
    </div>
  </div>
</template>

<style scoped>
.typo-ascii {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #0a0a0a;
  color: #e0e0e0;
  font-family: system-ui, sans-serif;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.title {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  font-size: 15px;
}

.sep {
  color: rgba(255, 255, 255, 0.2);
}

.desc {
  flex: 1;
  min-width: 200px;
}

.mode-switch {
  display: flex;
  gap: 2px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  padding: 2px;
}

.mode-switch button {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.45);
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.mode-switch button.active {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}

.display-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: hidden;
}

.art-box {
  width: v-bind("TARGET_ROW_W + 'px'");
  user-select: none;
}

.prop-box {
  font-family: v-bind("PROP_FAMILY");
  font-size: v-bind("FONT_SIZE + 'px'");
}

.mono-box {
  font-family: "SF Mono", ui-monospace, Menlo, Monaco, "Courier New", monospace;
  font-size: v-bind("FONT_SIZE + 'px'");
  letter-spacing: 0.5px;
}

.art-row {
  white-space: pre;
  overflow: hidden;
}

.source-box {
  display: flex;
  align-items: center;
  justify-content: center;
}

.source-box :deep(.source-canvas) {
  width: v-bind("CANVAS_W + 'px'");
  height: v-bind("CANVAS_H + 'px'");
  image-rendering: pixelated;
}

/* Font weight classes used in propHtml */
:deep(.w3) {
  font-weight: 300;
}
:deep(.w5) {
  font-weight: 500;
}
:deep(.w8) {
  font-weight: 800;
}
:deep(.it) {
  font-style: italic;
}

/* Alpha classes */
:deep(.a1) {
  opacity: 0.1;
}
:deep(.a2) {
  opacity: 0.2;
}
:deep(.a3) {
  opacity: 0.3;
}
:deep(.a4) {
  opacity: 0.4;
}
:deep(.a5) {
  opacity: 0.5;
}
:deep(.a6) {
  opacity: 0.6;
}
:deep(.a7) {
  opacity: 0.7;
}
:deep(.a8) {
  opacity: 0.8;
}
:deep(.a9) {
  opacity: 0.9;
}
:deep(.a10) {
  opacity: 1;
}
</style>
