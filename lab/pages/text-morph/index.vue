<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from "vue";
import { NKLButton, NKLRadioGroup, NKLSelect } from "@lab/design/components";
import TextMorph from "./component.vue";
import type { MorphPart } from "./core/glyphs";

type Scenario = "day" | "clock" | "free";

const scenario = ref<Scenario>("day");
const scenarioOptions = [
  { value: "day", label: "Day", description: "1日目 11/3(火) → 2日目 11/4(水)" },
  { value: "clock", label: "Clock", description: "Ticking HH:MM:SS" },
  { value: "free", label: "Free", description: "Type anything" },
] as const satisfies ReadonlyArray<{ value: Scenario; label: string; description: string }>;

const duration = ref(280);
const easing = ref("cubic-bezier(0.22, 1, 0.36, 1)");
const easingOptions = [
  { value: "cubic-bezier(0.22, 1, 0.36, 1)", label: "ease-out-quint" },
  { value: "ease", label: "ease" },
  { value: "ease-in-out", label: "ease-in-out" },
  { value: "linear", label: "linear" },
  { value: "cubic-bezier(0.34, 1.56, 0.64, 1)", label: "back-out" },
];

// Day: a booklet's day header
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const FIRST = new Date(2026, 10, 3);
const day = ref(1);
const dayParts = computed<MorphPart[]>(() => {
  const date = new Date(FIRST);
  date.setDate(FIRST.getDate() + day.value - 1);
  return [
    { text: `${day.value}日目`, tone: "day" },
    { text: " " },
    { text: `${date.getMonth() + 1}/${date.getDate()}`, tone: "date" },
    { text: `(${WEEKDAYS[date.getDay()]})`, tone: "weekday" },
  ];
});

// Clock: only the digits that change move
const now = ref(new Date());
let timer: ReturnType<typeof setInterval> | undefined;
watch(
  scenario,
  (s) => {
    clearInterval(timer);
    if (s === "clock") timer = setInterval(() => (now.value = new Date()), 1000);
  },
  { immediate: true },
);
onBeforeUnmount(() => clearInterval(timer));
const clockParts = computed<MorphPart[]>(() => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = now.value;
  return [{ text: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }];
});

// Free: anagrams and reorderings show the slide best
const free = ref("listen");
const presets = [
  "listen",
  "silent",
  "enlist",
  "Hello, world",
  "world, Hello",
  "Vue 3.5",
  "Vue 3.6 Vapor",
];
const freeParts = computed<MorphPart[]>(() => [{ text: free.value }]);

const parts = computed(
  () => ({ day: dayParts, clock: clockParts, free: freeParts })[scenario.value].value,
);

const morph = useTemplateRef<InstanceType<typeof TextMorph>>("morph");
</script>

<template>
  <div id="text-morph-lab">
    <h2>Text Morph</h2>

    <section>
      <TextMorph
        ref="morph"
        :parts="parts"
        :duration="duration"
        :easing="easing"
        class="stage"
        aria-live="polite"
      />
    </section>

    <output>
      <code>kept: {{ morph?.stats.kept ?? 0 }}</code>
      <code>entered: {{ morph?.stats.entered ?? 0 }}</code>
      <code>left: {{ morph?.stats.left ?? 0 }}</code>
    </output>

    <form @submit.prevent>
      <NKLRadioGroup
        v-model="scenario"
        name="scenario"
        legend="Scenario"
        :options="scenarioOptions"
      />

      <fieldset v-if="scenario === 'day'">
        <legend>Day</legend>
        <menu>
          <NKLButton :disabled="day <= 1" @click="day--">← prev</NKLButton>
          <NKLButton :disabled="day >= 14" @click="day++">next →</NKLButton>
        </menu>
      </fieldset>

      <fieldset v-else-if="scenario === 'free'">
        <legend>Text</legend>
        <label>
          text
          <input v-model="free" type="text" />
        </label>
        <menu>
          <NKLButton v-for="p in presets" :key="p" @click="free = p">{{ p }}</NKLButton>
        </menu>
      </fieldset>

      <fieldset>
        <legend>Motion</legend>
        <label>
          duration (ms)
          <input v-model.number="duration" type="range" min="0" max="2000" step="20" />
          <span>{{ duration }}</span>
        </label>
        <NKLSelect v-model="easing" label="easing" :options="easingOptions" />
      </fieldset>
    </form>
  </div>
</template>

<style scoped>
#text-morph-lab {
  padding: var(--space-6) var(--space-5);
  max-width: 560px;
  margin: 0 auto;

  section {
    display: grid;
    place-items: center;
    min-height: 160px;
    padding: var(--space-6) 0;
  }

  .stage {
    font-size: 40px;
    font-weight: 700;
    color: var(--text-h);
    font-variant-numeric: tabular-nums;

    :deep(.day) {
      color: var(--text-h);
    }
    :deep(.date) {
      color: var(--text);
    }
    :deep(.weekday) {
      color: var(--text);
      font-size: 0.7em;
    }
  }

  output {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-2);
    margin-bottom: var(--space-5);

    code {
      font-size: var(--text-xs);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-s);
      background: var(--accent-bg);
      color: var(--accent);
      font-variant-numeric: tabular-nums;
    }
  }

  form {
    display: grid;
    gap: var(--space-4);

    fieldset {
      display: grid;
      gap: var(--space-3);
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
      grid-template-columns: 100px 1fr 40px;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-m);
      color: var(--text);
      font-variant-numeric: tabular-nums;
    }

    input[type="text"] {
      grid-column: span 2;
      font-size: var(--text-m);
      padding: var(--space-1) var(--space-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-s);
      background: var(--bg);
      color: var(--text-h);
    }

    menu {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      padding: 0;
    }
  }
}
</style>
