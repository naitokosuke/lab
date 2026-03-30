<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch, nextTick } from "vue";
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";

interface Props {
  text: string;
  font: string;
  maxWidth: number;
  lineHeight: number;
  whiteSpace: "normal" | "pre-wrap";
}
const props = defineProps<Props>();

const canvasRef = useTemplateRef<HTMLCanvasElement>("canvas");
const domRef = useTemplateRef<HTMLDivElement>("dom");

const pretextHeight = ref(0);
const pretextLineCount = ref(0);
const domHeight = ref(0);
const domLineCount = ref(0);

const heightMatch = computed(() => Math.abs(pretextHeight.value - domHeight.value) < 1);

const canvasHeight = computed(() =>
  Math.max(props.lineHeight * 2, pretextHeight.value + props.lineHeight),
);

function renderPretext() {
  const prepared = prepareWithSegments(props.text, props.font, {
    whiteSpace: props.whiteSpace,
  });
  const result = layoutWithLines(prepared, props.maxWidth, props.lineHeight);

  pretextHeight.value = result.height;
  pretextLineCount.value = result.lineCount;

  const canvas = canvasRef.value;
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = props.maxWidth * dpr;
  canvas.height = canvasHeight.value * dpr;

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, props.maxWidth, canvasHeight.value);

  ctx.font = props.font;
  ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--text-h").trim() || "#fff";
  ctx.textBaseline = "top";

  const ascent = props.lineHeight * 0.8;

  for (let i = 0; i < result.lines.length; i++) {
    const line = result.lines[i];
    const y = i * props.lineHeight + (props.lineHeight - ascent) / 2;
    ctx.fillText(line.text, 0, y);
  }
}

function measureDom() {
  const el = domRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  domHeight.value = rect.height;
  domLineCount.value = Math.round(rect.height / props.lineHeight);
}

function update() {
  renderPretext();
  nextTick(measureDom);
}

watch(() => [props.text, props.font, props.maxWidth, props.lineHeight, props.whiteSpace], update);
onMounted(update);

defineExpose({ pretextHeight, pretextLineCount, domHeight, domLineCount });
</script>

<template>
  <div class="comparison-panel">
    <div class="panel">
      <h3>Pretext <small>(Canvas)</small></h3>
      <div class="render-area" :style="{ width: maxWidth + 'px' }">
        <canvas ref="canvas" :style="{ width: maxWidth + 'px', height: canvasHeight + 'px' }" />
      </div>
      <dl class="metrics">
        <dt>height</dt>
        <dd>{{ pretextHeight }}px</dd>
        <dt>lines</dt>
        <dd>{{ pretextLineCount }}</dd>
      </dl>
    </div>

    <div class="panel">
      <h3>DOM <small>(div)</small></h3>
      <div class="render-area" :style="{ width: maxWidth + 'px' }">
        <div
          ref="dom"
          class="dom-text"
          :style="{
            width: maxWidth + 'px',
            font: font,
            lineHeight: lineHeight + 'px',
            whiteSpace: whiteSpace === 'pre-wrap' ? 'pre-wrap' : 'normal',
            wordBreak: 'normal',
            overflowWrap: 'break-word',
          }"
        >
          {{ text }}
        </div>
      </div>
      <dl class="metrics">
        <dt>height</dt>
        <dd>{{ domHeight.toFixed(1) }}px</dd>
        <dt>lines</dt>
        <dd>{{ domLineCount }}</dd>
      </dl>
    </div>

    <div class="match-indicator" :class="{ match: heightMatch, mismatch: !heightMatch }">
      {{ heightMatch ? "Match" : "Mismatch" }}
    </div>
  </div>
</template>

<style scoped>
.comparison-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  position: relative;

  .panel {
    border: 1px solid var(--border);
    border-radius: var(--radius-l);
    padding: var(--space-3);
    overflow: hidden;

    h3 {
      margin: 0 0 var(--space-2);
      font-size: var(--text-m);
      color: var(--text-h);

      small {
        font-weight: 400;
        color: var(--text);
      }
    }
  }

  .render-area {
    overflow-x: auto;
    margin-bottom: var(--space-2);
    min-height: 48px;

    canvas {
      display: block;
    }
  }

  .dom-text {
    color: var(--text-h);
  }

  .metrics {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;

    dt {
      color: var(--text);
    }
    dd {
      margin: 0;
      color: var(--accent);
    }
  }

  .match-indicator {
    position: absolute;
    top: var(--space-2);
    left: 50%;
    translate: -50% 0;
    font-size: var(--text-xs);
    font-weight: 600;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-s);

    &.match {
      background: color-mix(in oklch, green 20%, transparent);
      color: green;
    }
    &.mismatch {
      background: color-mix(in oklch, red 20%, transparent);
      color: red;
    }
  }
}
</style>
