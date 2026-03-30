<script setup lang="ts">
import { computed, ref, useTemplateRef, watch, nextTick } from "vue";
import { NKLButton } from "@lab/design/components";
import { prepareWithSegments, layout } from "@chenglou/pretext";
import PretextComparison from "./component.vue";
import { usePretextBenchmark } from "./composable";

const text = ref("AGI 春天到了. بدأت الرحلة 🚀\nThe quick brown fox jumps over the lazy dog.");
const fontSize = ref(16);
const fontFamily = ref("Inter");
const maxWidth = ref(320);
const lineHeight = ref(24);
const whiteSpace = ref<"normal" | "pre-wrap">("normal");

const font = computed(() => `${fontSize.value}px ${fontFamily.value}`);

const comparisonRef = useTemplateRef<InstanceType<typeof PretextComparison>>("comparison");

const fontFamilyOptions = ["Inter", "Georgia", "monospace", "sans-serif", "serif"];

// --- Benchmark ---
const {
  result: benchResult,
  isRunning: benchRunning,
  runBenchmark,
} = usePretextBenchmark(text, font, maxWidth, lineHeight, whiteSpace);

// --- Two-Phase Insight ---
const prepareMs = ref(0);
const layoutMs = ref(0);
const prepareFlash = ref(false);
const layoutFlash = ref(false);

let cachedPrepared: ReturnType<typeof prepareWithSegments> | null = null;

function flash(target: typeof prepareFlash) {
  target.value = false;
  nextTick(() => {
    target.value = true;
  });
}

watch(
  [text, font, whiteSpace],
  () => {
    const t0 = performance.now();
    cachedPrepared = prepareWithSegments(text.value, font.value, {
      whiteSpace: whiteSpace.value,
    });
    const t1 = performance.now();
    prepareMs.value = t1 - t0;
    flash(prepareFlash);

    // Also run layout
    const t2 = performance.now();
    layout(cachedPrepared, maxWidth.value, lineHeight.value);
    const t3 = performance.now();
    layoutMs.value = t3 - t2;
    flash(layoutFlash);
  },
  { immediate: true },
);

watch([maxWidth, lineHeight], () => {
  if (!cachedPrepared) return;
  const t0 = performance.now();
  layout(cachedPrepared, maxWidth.value, lineHeight.value);
  const t1 = performance.now();
  layoutMs.value = t1 - t0;
  flash(layoutFlash);
});
</script>

<template>
  <div id="pretext-lab">
    <h2>Pretext</h2>

    <!-- Section 1: Side-by-Side -->
    <section class="comparison">
      <PretextComparison
        ref="comparison"
        :text="text"
        :font="font"
        :max-width="maxWidth"
        :line-height="lineHeight"
        :white-space="whiteSpace"
      />
    </section>

    <!-- Section 2: Performance Benchmark -->
    <section class="benchmark">
      <h3>Performance Benchmark</h3>
      <output v-if="benchResult">
        <code>DOM (getBoundingClientRect): {{ benchResult.domMedianMs.toFixed(3) }}ms</code>
        <code>Pretext (layout): {{ benchResult.layoutMedianMs.toFixed(3) }}ms</code>
        <code class="highlight">{{ benchResult.speedup.toFixed(0) }}x faster</code>
      </output>
      <p v-else class="hint">100回の計測の中央値を比較します</p>
      <NKLButton :disabled="benchRunning" @click="runBenchmark()">
        {{ benchRunning ? "Running..." : "Run Benchmark" }}
      </NKLButton>
    </section>

    <!-- Section 3: Two-Phase Insight -->
    <section class="two-phase">
      <h3>Two-Phase Cost</h3>
      <output>
        <code :class="{ flash: prepareFlash }" @animationend="prepareFlash = false">
          prepare(): {{ prepareMs.toFixed(3) }}ms
        </code>
        <code :class="{ flash: layoutFlash }" @animationend="layoutFlash = false">
          layout(): {{ layoutMs.toFixed(3) }}ms
        </code>
      </output>
      <p class="hint">
        maxWidth スライダーを動かすと layout() だけが再実行されます。テキストやフォントを変えると
        prepare() も再実行されます。
      </p>
    </section>

    <!-- Section 4: Controls -->
    <form @submit.prevent>
      <fieldset>
        <legend>Input</legend>
        <label class="full">
          text
          <textarea v-model="text" rows="4" />
        </label>
      </fieldset>

      <fieldset>
        <legend>Layout</legend>

        <label>
          fontSize
          <input v-model.number="fontSize" type="range" min="8" max="48" />
          <span>{{ fontSize }}px</span>
        </label>

        <label>
          fontFamily
          <select v-model="fontFamily">
            <option v-for="opt in fontFamilyOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>

        <label>
          maxWidth
          <input v-model.number="maxWidth" type="range" min="100" max="800" />
          <span>{{ maxWidth }}px</span>
        </label>

        <label>
          lineHeight
          <input v-model.number="lineHeight" type="range" min="12" max="60" />
          <span>{{ lineHeight }}px</span>
        </label>

        <label>
          whiteSpace
          <select v-model="whiteSpace">
            <option value="normal">normal</option>
            <option value="pre-wrap">pre-wrap</option>
          </select>
        </label>
      </fieldset>
    </form>
  </div>
</template>

<style scoped>
#pretext-lab {
  padding: var(--space-6) var(--space-5);
  max-width: 960px;
  margin: 0 auto;

  h3 {
    margin: 0 0 var(--space-3);
    font-size: var(--text-m);
    font-weight: 600;
    color: var(--text-h);
  }

  .comparison {
    padding: var(--space-4) 0;
  }

  .benchmark {
    margin-bottom: var(--space-5);

    output {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: var(--space-2);
      margin-bottom: var(--space-3);

      code {
        font-size: var(--text-xs);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-s);
        background: var(--accent-bg);
        color: var(--accent);
        font-variant-numeric: tabular-nums;

        &.highlight {
          font-weight: 700;
        }
      }
    }
  }

  .two-phase {
    margin-bottom: var(--space-5);

    output {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-2);
      margin-bottom: var(--space-2);

      code {
        font-size: var(--text-xs);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-s);
        background: var(--accent-bg);
        color: var(--accent);
        font-variant-numeric: tabular-nums;
      }

      .flash {
        animation: flash-bg 300ms ease-out;
      }
    }
  }

  .hint {
    font-size: var(--text-xs);
    color: var(--text);
    margin: 0 0 var(--space-3);
  }

  form {
    display: grid;
    gap: var(--space-4);

    fieldset {
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
      grid-template-columns: 100px 1fr 60px;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-m);
      color: var(--text);
      margin-bottom: var(--space-2);
      font-variant-numeric: tabular-nums;

      &:last-child {
        margin-bottom: 0;
      }

      &.full {
        grid-template-columns: 1fr;
      }
    }

    textarea {
      font-size: var(--text-m);
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border);
      border-radius: var(--radius-s);
      background: var(--bg);
      color: var(--text-h);
      resize: vertical;
      font-family: inherit;
      margin-top: var(--space-1);
    }

    input[type="number"],
    input[type="text"],
    select {
      font-size: var(--text-m);
      padding: var(--space-1) var(--space-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-s);
      background: var(--bg);
      color: var(--text-h);
    }
  }
}

@keyframes flash-bg {
  from {
    background: var(--accent);
    color: var(--bg);
  }
}
</style>
