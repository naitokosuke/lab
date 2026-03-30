<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef, watch } from "vue";
import { prepareWithSegments } from "@chenglou/pretext";
import { layoutTextAroundObstacles, type Obstacle, type PositionedLine } from "./composable";
import { BODY_COPY } from "@chenglou/pretext/demos/dynamic-layout-text.ts";

const FONT_FAMILY = '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif';
const BODY_FONT_SIZE = 18;
const BODY_LINE_HEIGHT = 30;
const BODY_FONT = `${BODY_FONT_SIZE}px ${FONT_FAMILY}`;
const HEADLINE_TEXT = "SITUATIONAL\nAWARENESS";
const HEADLINE_FONT_SIZE = 56;
const HEADLINE_FONT = `800 ${HEADLINE_FONT_SIZE}px ${FONT_FAMILY}`;
const HEADLINE_LINE_HEIGHT = 60;
const OBSTACLE_PADDING = 20;

const canvasRef = useTemplateRef<HTMLCanvasElement>("canvas");
const layoutTimeMs = ref(0);

const obstacles = ref<Obstacle[]>([
  { id: 0, cx: 260, cy: 340, r: 80, color: "rgba(255, 140, 50, 0.15)", glowColor: "rgba(255, 140, 50, 0.6)" },
  { id: 1, cx: 520, cy: 560, r: 65, color: "rgba(80, 120, 255, 0.15)", glowColor: "rgba(80, 120, 255, 0.6)" },
  { id: 2, cx: 140, cy: 720, r: 50, color: "rgba(50, 200, 140, 0.15)", glowColor: "rgba(50, 200, 140, 0.6)" },
]);

let dragging: { id: number; offsetX: number; offsetY: number } | null = null;
let hoveredId: number | null = null;
let animationId = 0;
let canvasWidth = 0;
let canvasHeight = 0;
let prepared = prepareWithSegments(BODY_COPY, BODY_FONT);
let headlinePrepared = prepareWithSegments(HEADLINE_TEXT, HEADLINE_FONT, { whiteSpace: "pre-wrap" });

function hitTest(x: number, y: number): number | null {
  for (let i = obstacles.value.length - 1; i >= 0; i--) {
    const o = obstacles.value[i];
    const dx = x - o.cx;
    const dy = y - o.cy;
    if (dx * dx + dy * dy <= o.r * o.r) return o.id;
  }
  return null;
}

function getCanvasCoords(e: MouseEvent | Touch): { x: number; y: number } {
  const canvas = canvasRef.value;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width / (window.devicePixelRatio || 1)),
    y: (e.clientY - rect.top) * (canvas.height / rect.height / (window.devicePixelRatio || 1)),
  };
}

function onPointerDown(e: MouseEvent) {
  const { x, y } = getCanvasCoords(e);
  const id = hitTest(x, y);
  if (id !== null) {
    const o = obstacles.value.find((o) => o.id === id)!;
    dragging = { id, offsetX: x - o.cx, offsetY: y - o.cy };
    e.preventDefault();
  }
}

function onPointerMove(e: MouseEvent) {
  const { x, y } = getCanvasCoords(e);
  if (dragging) {
    const o = obstacles.value.find((o) => o.id === dragging!.id);
    if (o) {
      o.cx = x - dragging.offsetX;
      o.cy = y - dragging.offsetY;
    }
    scheduleRender();
  } else {
    const id = hitTest(x, y);
    if (id !== hoveredId) {
      hoveredId = id;
      const canvas = canvasRef.value;
      if (canvas) canvas.style.cursor = hoveredId !== null ? "grab" : "default";
      scheduleRender();
    }
  }
}

function onPointerUp() {
  if (dragging) {
    dragging = null;
    const canvas = canvasRef.value;
    if (canvas) canvas.style.cursor = hoveredId !== null ? "grab" : "default";
  }
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return;
  const { x, y } = getCanvasCoords(e.touches[0]);
  const id = hitTest(x, y);
  if (id !== null) {
    const o = obstacles.value.find((o) => o.id === id)!;
    dragging = { id, offsetX: x - o.cx, offsetY: y - o.cy };
    e.preventDefault();
  }
}

function onTouchMove(e: TouchEvent) {
  if (!dragging || e.touches.length !== 1) return;
  const { x, y } = getCanvasCoords(e.touches[0]);
  const o = obstacles.value.find((o) => o.id === dragging!.id);
  if (o) {
    o.cx = x - dragging.offsetX;
    o.cy = y - dragging.offsetY;
  }
  scheduleRender();
  e.preventDefault();
}

function onTouchEnd() {
  dragging = null;
}

let renderScheduled = false;
function scheduleRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  animationId = requestAnimationFrame(() => {
    renderScheduled = false;
    render();
  });
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle, isHovered: boolean) {
  // Glow
  const glowGrad = ctx.createRadialGradient(o.cx, o.cy, o.r * 0.3, o.cx, o.cy, o.r * 1.8);
  glowGrad.addColorStop(0, o.glowColor);
  glowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(o.cx, o.cy, o.r * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Circle body
  const bodyGrad = ctx.createRadialGradient(o.cx - o.r * 0.3, o.cy - o.r * 0.3, 0, o.cx, o.cy, o.r);
  bodyGrad.addColorStop(0, o.glowColor.replace(/[\d.]+\)$/, "0.35)"));
  bodyGrad.addColorStop(1, o.color);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(o.cx, o.cy, o.r, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = o.glowColor.replace(/[\d.]+\)$/, isHovered ? "0.8)" : "0.4)");
  ctx.lineWidth = isHovered ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.arc(o.cx, o.cy, o.r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLines(ctx: CanvasRenderingContext2D, lines: PositionedLine[], font: string, lineHeight: number, color: string) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  const ascent = lineHeight * 0.76;
  for (const line of lines) {
    const yOffset = (lineHeight - ascent) / 2;
    ctx.fillText(line.text, line.x, line.y + yOffset);
  }
}

function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvasWidth = rect.width;
  canvasHeight = rect.height;

  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  // Background
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  ctx.fillStyle = isDark ? "#0a0a0a" : "#fafaf8";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Subtle paper texture lines
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  ctx.lineWidth = 0.5;
  for (let y = 0; y < canvasHeight; y += BODY_LINE_HEIGHT) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }

  const gutter = Math.max(32, canvasWidth * 0.06);
  const textColor = isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)";
  const subtleColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";

  // Headline
  const headlineLines = layoutTextAroundObstacles(
    headlinePrepared,
    obstacles.value,
    gutter,
    gutter,
    canvasWidth - gutter * 2,
    HEADLINE_LINE_HEIGHT * 3,
    HEADLINE_LINE_HEIGHT,
    OBSTACLE_PADDING,
  );
  drawLines(ctx, headlineLines, HEADLINE_FONT, HEADLINE_LINE_HEIGHT, textColor);

  const headlineBottom = headlineLines.length > 0
    ? Math.max(...headlineLines.map((l) => l.y + HEADLINE_LINE_HEIGHT))
    : gutter + HEADLINE_LINE_HEIGHT * 2;

  // Subtitle
  const subtitleY = headlineBottom + 8;
  ctx.font = `italic ${BODY_FONT_SIZE - 2}px ${FONT_FAMILY}`;
  ctx.fillStyle = subtleColor;
  ctx.textBaseline = "top";
  ctx.fillText("Leopold Aschenbrenner — drag the circles to reflow text", gutter, subtitleY);

  const bodyTop = subtitleY + BODY_LINE_HEIGHT + 8;

  // Layout body text around obstacles
  const t0 = performance.now();
  const bodyLines = layoutTextAroundObstacles(
    prepared,
    obstacles.value,
    gutter,
    bodyTop,
    canvasWidth - gutter * 2,
    canvasHeight - bodyTop - gutter,
    BODY_LINE_HEIGHT,
    OBSTACLE_PADDING,
  );
  const t1 = performance.now();
  layoutTimeMs.value = t1 - t0;

  // Draw body text
  drawLines(ctx, bodyLines, BODY_FONT, BODY_LINE_HEIGHT, textColor);

  // Draw obstacles on top
  for (const o of obstacles.value) {
    drawObstacle(ctx, o, o.id === hoveredId);
  }

  // Performance badge
  ctx.font = `11px ${getComputedStyle(canvas).getPropertyValue("--mono").trim() || "monospace"}`;
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  ctx.fillText(`layout: ${layoutTimeMs.value.toFixed(2)}ms · ${bodyLines.length} lines`, canvasWidth - gutter, canvasHeight - 12);
  ctx.textAlign = "left";
}

function onResize() {
  scheduleRender();
}

watch(obstacles, () => scheduleRender(), { deep: true });

onMounted(() => {
  window.addEventListener("resize", onResize);
  document.addEventListener("mousemove", onPointerMove);
  document.addEventListener("mouseup", onPointerUp);
  scheduleRender();
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener("resize", onResize);
  document.removeEventListener("mousemove", onPointerMove);
  document.removeEventListener("mouseup", onPointerUp);
});
</script>

<template>
  <canvas
    ref="canvas"
    class="editorial-canvas"
    @mousedown="onPointerDown"
    @touchstart.passive="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  />
</template>

<style scoped>
.editorial-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
