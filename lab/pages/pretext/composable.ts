import { type Ref, ref, shallowRef } from "vue";
import { prepare, layout } from "@chenglou/pretext";

export interface BenchmarkResult {
  domMedianMs: number;
  layoutMedianMs: number;
  speedup: number;
}

export function usePretextBenchmark(
  text: Ref<string>,
  font: Ref<string>,
  maxWidth: Ref<number>,
  lineHeight: Ref<number>,
  whiteSpace: Ref<"normal" | "pre-wrap">,
) {
  const result = shallowRef<BenchmarkResult | null>(null);
  const isRunning = ref(false);

  function median(arr: number[]): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function runBenchmark() {
    if (isRunning.value) return;
    isRunning.value = true;

    const iterations = 100;

    // DOM benchmark: create an offscreen element
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    el.style.top = "0";
    el.style.font = font.value;
    el.style.lineHeight = `${lineHeight.value}px`;
    el.style.whiteSpace = whiteSpace.value === "pre-wrap" ? "pre-wrap" : "normal";
    el.style.wordBreak = "normal";
    el.style.overflowWrap = "break-word";
    el.textContent = text.value;
    document.body.appendChild(el);

    const domTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      // Slightly vary width to defeat browser layout caching
      el.style.width = `${maxWidth.value + (i % 2 === 0 ? 0 : 0.1)}px`;
      const t0 = performance.now();
      el.getBoundingClientRect();
      const t1 = performance.now();
      domTimes.push(t1 - t0);
    }
    document.body.removeChild(el);

    // Pretext benchmark: prepare once, layout N times
    const prepared = prepare(text.value, font.value, { whiteSpace: whiteSpace.value });
    const layoutTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const w = maxWidth.value + (i % 2 === 0 ? 0 : 0.1);
      const t0 = performance.now();
      layout(prepared, w, lineHeight.value);
      const t1 = performance.now();
      layoutTimes.push(t1 - t0);
    }

    const domMs = median(domTimes);
    const layoutMs = median(layoutTimes);

    result.value = {
      domMedianMs: domMs,
      layoutMedianMs: layoutMs,
      speedup: layoutMs > 0 ? domMs / layoutMs : Infinity,
    };
    isRunning.value = false;
  }

  return { result, isRunning, runBenchmark };
}
