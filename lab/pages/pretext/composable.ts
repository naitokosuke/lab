import { prepareWithSegments } from "./core";

// --- Constants ---
const COLS = 50;
const ROWS = 28;
const FONT_SIZE = 14;
const LINE_HEIGHT = 16;
const TARGET_ROW_W = 440;
const PROP_FAMILY = 'Georgia, Palatino, "Times New Roman", serif';
const FIELD_OVERSAMPLE = 2;
const FIELD_COLS = COLS * FIELD_OVERSAMPLE;
const FIELD_ROWS = ROWS * FIELD_OVERSAMPLE;
const CANVAS_W = 220;
const CANVAS_H = Math.round(CANVAS_W * ((ROWS * LINE_HEIGHT) / TARGET_ROW_W));
const FIELD_SCALE_X = FIELD_COLS / CANVAS_W;
const FIELD_SCALE_Y = FIELD_ROWS / CANVAS_H;
const PARTICLE_N = 120;
const SPRITE_R = 14;
const ATTRACTOR_R = 12;
const LARGE_ATTRACTOR_R = 30;
const ATTRACTOR_FORCE_1 = 0.22;
const ATTRACTOR_FORCE_2 = 0.05;
const FIELD_DECAY = 0.82;
const CHARSET = " .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const WEIGHTS = [300, 500, 800] as const;
const STYLES = ["normal", "italic"] as const;

type FontStyleVariant = (typeof STYLES)[number];

type PaletteEntry = {
  char: string;
  weight: number;
  style: FontStyleVariant;
  width: number;
  brightness: number;
};

export type BrightnessEntry = {
  monoChar: string;
  propHtml: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type FieldStamp = {
  radiusX: number;
  radiusY: number;
  sizeX: number;
  sizeY: number;
  values: Float32Array;
};

// --- Brightness estimation ---
const brightnessCanvas = document.createElement("canvas");
brightnessCanvas.width = 28;
brightnessCanvas.height = 28;
const bCtx = brightnessCanvas.getContext("2d", { willReadFrequently: true })!;

function estimateBrightness(ch: string, font: string): number {
  const size = 28;
  bCtx.clearRect(0, 0, size, size);
  bCtx.font = font;
  bCtx.fillStyle = "#fff";
  bCtx.textBaseline = "middle";
  bCtx.fillText(ch, 1, size / 2);
  const data = bCtx.getImageData(0, 0, size, size).data;
  let sum = 0;
  for (let i = 3; i < data.length; i += 4) sum += data[i]!;
  return sum / (255 * size * size);
}

function measureWidth(ch: string, font: string): number {
  const prepared = prepareWithSegments(ch, font);
  return prepared.widths.length > 0 ? prepared.widths[0]! : 0;
}

// --- Build palette (runs once at module load) ---
const palette: PaletteEntry[] = [];
for (const style of STYLES) {
  for (const weight of WEIGHTS) {
    const font = `${style === "italic" ? "italic " : ""}${weight} ${FONT_SIZE}px ${PROP_FAMILY}`;
    for (const ch of CHARSET) {
      if (ch === " ") continue;
      const width = measureWidth(ch, font);
      if (width <= 0) continue;
      const brightness = estimateBrightness(ch, font);
      palette.push({ char: ch, weight, style, width, brightness });
    }
  }
}

const maxBrightness = Math.max(...palette.map((e) => e.brightness));
if (maxBrightness > 0) {
  for (const entry of palette) entry.brightness /= maxBrightness;
}
palette.sort((a, b) => a.brightness - b.brightness);

const targetCellW = TARGET_ROW_W / COLS;

function findBest(targetBrightness: number): PaletteEntry {
  let lo = 0;
  let hi = palette.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (palette[mid]!.brightness < targetBrightness) lo = mid + 1;
    else hi = mid;
  }
  let bestScore = Infinity;
  let best = palette[lo]!;
  const start = Math.max(0, lo - 15);
  const end = Math.min(palette.length, lo + 15);
  for (let i = start; i < end; i++) {
    const entry = palette[i]!;
    const brightnessError = Math.abs(entry.brightness - targetBrightness) * 2.5;
    const widthError = Math.abs(entry.width - targetCellW) / targetCellW;
    const score = brightnessError + widthError;
    if (score < bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return best;
}

function wCls(weight: number, style: FontStyleVariant): string {
  const weightClass = weight === 300 ? "w3" : weight === 500 ? "w5" : "w8";
  return style === "italic" ? `${weightClass} it` : weightClass;
}

function esc(ch: string): string {
  if (ch === "<") return "&lt;";
  if (ch === ">") return "&gt;";
  if (ch === "&") return "&amp;";
  if (ch === '"') return "&quot;";
  return ch;
}

const MONO_RAMP = " .`-_:,;^=+/|)\\!?0oOQ#%@";

export const brightnessLookup: BrightnessEntry[] = [];
for (let b = 0; b < 256; b++) {
  const brightness = b / 255;
  const monoChar = MONO_RAMP[Math.min(MONO_RAMP.length - 1, (brightness * MONO_RAMP.length) | 0)]!;
  if (brightness < 0.03) {
    brightnessLookup.push({ monoChar, propHtml: " " });
    continue;
  }
  const match = findBest(brightness);
  const alphaIndex = Math.max(1, Math.min(10, Math.round(brightness * 10)));
  brightnessLookup.push({
    monoChar,
    propHtml: `<span class="${wCls(match.weight, match.style)} a${alphaIndex}">${esc(match.char)}</span>`,
  });
}

// --- Particle simulation ---
function spriteAlphaAt(normalizedDistance: number): number {
  if (normalizedDistance >= 1) return 0;
  if (normalizedDistance <= 0.35) return 0.45 + (0.15 - 0.45) * (normalizedDistance / 0.35);
  return 0.15 * (1 - (normalizedDistance - 0.35) / 0.65);
}

function createFieldStamp(radiusPx: number): FieldStamp {
  const fieldRadiusX = radiusPx * FIELD_SCALE_X;
  const fieldRadiusY = radiusPx * FIELD_SCALE_Y;
  const radiusX = Math.ceil(fieldRadiusX);
  const radiusY = Math.ceil(fieldRadiusY);
  const sizeX = radiusX * 2 + 1;
  const sizeY = radiusY * 2 + 1;
  const values = new Float32Array(sizeX * sizeY);
  for (let y = -radiusY; y <= radiusY; y++) {
    for (let x = -radiusX; x <= radiusX; x++) {
      const nd = Math.sqrt((x / fieldRadiusX) ** 2 + (y / fieldRadiusY) ** 2);
      values[(y + radiusY) * sizeX + x + radiusX] = spriteAlphaAt(nd);
    }
  }
  return { radiusX, radiusY, sizeX, sizeY, values };
}

const particleStamp = createFieldStamp(SPRITE_R);
const largeAttractorStamp = createFieldStamp(LARGE_ATTRACTOR_R);
const smallAttractorStamp = createFieldStamp(ATTRACTOR_R);

function splatFieldStamp(
  field: Float32Array,
  centerX: number,
  centerY: number,
  stamp: FieldStamp,
): void {
  const gridCX = Math.round(centerX * FIELD_SCALE_X);
  const gridCY = Math.round(centerY * FIELD_SCALE_Y);
  for (let y = -stamp.radiusY; y <= stamp.radiusY; y++) {
    const gy = gridCY + y;
    if (gy < 0 || gy >= FIELD_ROWS) continue;
    const fro = gy * FIELD_COLS;
    const sro = (y + stamp.radiusY) * stamp.sizeX;
    for (let x = -stamp.radiusX; x <= stamp.radiusX; x++) {
      const gx = gridCX + x;
      if (gx < 0 || gx >= FIELD_COLS) continue;
      const sv = stamp.values[sro + x + stamp.radiusX]!;
      if (sv === 0) continue;
      const fi = fro + gx;
      field[fi] = Math.min(1, field[fi]! + sv);
    }
  }
}

const spriteCache = new Map<number, HTMLCanvasElement>();

function getSpriteCanvas(radius: number): HTMLCanvasElement {
  const cached = spriteCache.get(radius);
  if (cached) return cached;
  const c = document.createElement("canvas");
  c.width = radius * 2;
  c.height = radius * 2;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  g.addColorStop(0, "rgba(255,255,255,0.45)");
  g.addColorStop(0.35, "rgba(255,255,255,0.15)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, radius * 2, radius * 2);
  spriteCache.set(radius, c);
  return c;
}

export interface SimulationState {
  particles: Particle[];
  brightnessField: Float32Array;
  simulationCanvas: HTMLCanvasElement;
  simulationCtx: CanvasRenderingContext2D;
}

export function createSimulation(): SimulationState {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_N; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 40 + 20;
    particles.push({
      x: CANVAS_W / 2 + Math.cos(angle) * radius,
      y: CANVAS_H / 2 + Math.sin(angle) * radius,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
    });
  }
  const simulationCanvas = document.createElement("canvas");
  simulationCanvas.width = CANVAS_W;
  simulationCanvas.height = CANVAS_H;
  const simulationCtx = simulationCanvas.getContext("2d", { willReadFrequently: true })!;
  return {
    particles,
    brightnessField: new Float32Array(FIELD_COLS * FIELD_ROWS),
    simulationCanvas,
    simulationCtx,
  };
}

export interface FrameResult {
  rows: { monoText: string; propHtml: string }[];
}

export function stepSimulation(state: SimulationState, now: number): FrameResult {
  const { particles, brightnessField, simulationCtx: sCtx } = state;

  const a1x = Math.cos(now * 0.0007) * CANVAS_W * 0.25 + CANVAS_W / 2;
  const a1y = Math.sin(now * 0.0011) * CANVAS_H * 0.3 + CANVAS_H / 2;
  const a2x = Math.cos(now * 0.0013 + Math.PI) * CANVAS_W * 0.2 + CANVAS_W / 2;
  const a2y = Math.sin(now * 0.0009 + Math.PI) * CANVAS_H * 0.25 + CANVAS_H / 2;

  // Update particles
  for (const p of particles) {
    const d1x = a1x - p.x;
    const d1y = a1y - p.y;
    const d2x = a2x - p.x;
    const d2y = a2y - p.y;
    const dist1 = d1x * d1x + d1y * d1y;
    const dist2 = d2x * d2x + d2y * d2y;
    const ax = dist1 < dist2 ? d1x : d2x;
    const ay = dist1 < dist2 ? d1y : d2y;
    const dist = Math.sqrt(Math.min(dist1, dist2)) + 1;
    const force = dist1 < dist2 ? ATTRACTOR_FORCE_1 : ATTRACTOR_FORCE_2;
    p.vx += (ax / dist) * force + (Math.random() - 0.5) * 0.25;
    p.vy += (ay / dist) * force + (Math.random() - 0.5) * 0.25;
    p.vx *= 0.97;
    p.vy *= 0.97;
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < -SPRITE_R) p.x += CANVAS_W + SPRITE_R * 2;
    if (p.x > CANVAS_W + SPRITE_R) p.x -= CANVAS_W + SPRITE_R * 2;
    if (p.y < -SPRITE_R) p.y += CANVAS_H + SPRITE_R * 2;
    if (p.y > CANVAS_H + SPRITE_R) p.y -= CANVAS_H + SPRITE_R * 2;
  }

  // Render simulation canvas
  sCtx.fillStyle = "rgba(0,0,0,0.18)";
  sCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  sCtx.globalCompositeOperation = "lighter";
  const pSprite = getSpriteCanvas(SPRITE_R);
  for (const p of particles) sCtx.drawImage(pSprite, p.x - SPRITE_R, p.y - SPRITE_R);
  sCtx.drawImage(
    getSpriteCanvas(LARGE_ATTRACTOR_R),
    a1x - LARGE_ATTRACTOR_R,
    a1y - LARGE_ATTRACTOR_R,
  );
  sCtx.drawImage(getSpriteCanvas(ATTRACTOR_R), a2x - ATTRACTOR_R, a2y - ATTRACTOR_R);
  sCtx.globalCompositeOperation = "source-over";

  // Update brightness field
  for (let i = 0; i < brightnessField.length; i++)
    brightnessField[i] = brightnessField[i]! * FIELD_DECAY;
  for (const p of particles) splatFieldStamp(brightnessField, p.x, p.y, particleStamp);
  splatFieldStamp(brightnessField, a1x, a1y, largeAttractorStamp);
  splatFieldStamp(brightnessField, a2x, a2y, smallAttractorStamp);

  // Sample field to text rows
  const rows: { monoText: string; propHtml: string }[] = [];
  for (let row = 0; row < ROWS; row++) {
    let propHtml = "";
    let monoText = "";
    const fieldRowStart = row * FIELD_OVERSAMPLE * FIELD_COLS;
    for (let col = 0; col < COLS; col++) {
      const fieldColStart = col * FIELD_OVERSAMPLE;
      let brightness = 0;
      for (let sy = 0; sy < FIELD_OVERSAMPLE; sy++) {
        const sro = fieldRowStart + sy * FIELD_COLS + fieldColStart;
        for (let sx = 0; sx < FIELD_OVERSAMPLE; sx++) brightness += brightnessField[sro + sx]!;
      }
      const bb = Math.min(255, ((brightness / (FIELD_OVERSAMPLE * FIELD_OVERSAMPLE)) * 255) | 0);
      const entry = brightnessLookup[bb]!;
      propHtml += entry.propHtml;
      monoText += entry.monoChar;
    }
    rows.push({ monoText, propHtml });
  }

  return { rows };
}

export { ROWS, LINE_HEIGHT, TARGET_ROW_W, CANVAS_W, CANVAS_H, FONT_SIZE, PROP_FAMILY };
