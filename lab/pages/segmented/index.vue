<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NKLButton, NKLRadioGroup, NKLSelect } from "@lab/design/components";
import Segmented from "./component.vue";
import TabList from "./TabList.vue";
import TabPanel from "./TabPanel.vue";
import type { Option } from "./composable";

const duration = ref(350);
const easing = ref("cubic-bezier(0.22, 1, 0.36, 1)");
const easingOptions = [
  { value: "cubic-bezier(0.22, 1, 0.36, 1)", label: "ease-out-quint" },
  { value: "ease", label: "ease" },
  { value: "ease-in-out", label: "ease-in-out" },
  { value: "linear", label: "linear" },
  { value: "cubic-bezier(0.34, 1.56, 0.64, 1)", label: "back-out" },
];

// Segmented: labels of very different widths, so the pill visibly stretches
type Labels = "short" | "long";
const labels = ref<Labels>("short");
const labelOptions = [
  { value: "short", label: "Short", description: "Day / Week / Month …" },
  {
    value: "long",
    label: "Long",
    description: "Same options, wider labels: re-measured on resize",
  },
] as const satisfies ReadonlyArray<{ value: Labels; label: string; description: string }>;

const POOL = [
  { value: "day", short: "Day", long: "Today only" },
  { value: "week", short: "Week", long: "This whole week" },
  { value: "month", short: "Month", long: "Month" },
  { value: "year", short: "Year", long: "The year so far" },
  { value: "all", short: "All time", long: "Everything, ever" },
  { value: "custom", short: "Custom…", long: "Pick a custom range…" },
];
const count = ref(4);
const options = computed<Option[]>(() =>
  POOL.slice(0, count.value).map((o) => ({ value: o.value, label: o[labels.value] })),
);
const range = ref("week");
// a removed option can't stay chosen
watch(options, (os) => {
  if (!os.some((o) => o.value === range.value)) range.value = os.at(-1)?.value ?? "day";
});

const fontSize = ref(13);

// Tabs: more than fit, so the row scrolls and the chosen tab is brought into view
const tabs = [
  { value: "overview", label: "Overview" },
  { value: "itinerary", label: "Itinerary" },
  { value: "map", label: "Map" },
  { value: "members", label: "Members" },
  { value: "expenses", label: "Shared expenses" },
  { value: "packing", label: "Packing list" },
  { value: "notes", label: "Notes" },
] as const satisfies readonly Option[];
type Tab = (typeof tabs)[number]["value"];
const tab = ref<Tab>("overview");
const current = computed(() => tabs.find((t) => t.value === tab.value));
</script>

<template>
  <div id="segmented-lab">
    <h2>Segmented</h2>

    <section>
      <div class="stage" :style="{ fontSize: `${fontSize}px` }">
        <Segmented
          v-model="range"
          :options="options"
          label="Range"
          :duration="duration"
          :easing="easing"
        />
      </div>
      <output>
        <code>selected: {{ range }}</code>
      </output>
    </section>

    <section>
      <TabList v-model="tab" :tabs="tabs" label="Trip" :duration="duration" :easing="easing" />
      <TabPanel :aria-label="current?.label">
        <p>
          <strong>{{ current?.label }}</strong> — the underline is the same indicator as the pill
          above: it follows whichever child is <code>aria-selected</code>.
        </p>
      </TabPanel>
    </section>

    <form @submit.prevent>
      <fieldset>
        <legend>Options</legend>
        <NKLRadioGroup v-model="labels" name="labels" legend="Labels" :options="labelOptions" />
        <label>
          count
          <input v-model.number="count" type="range" min="2" :max="POOL.length" step="1" />
          <span>{{ count }}</span>
        </label>
        <label>
          font (px)
          <input v-model.number="fontSize" type="range" min="10" max="22" step="1" />
          <span>{{ fontSize }}</span>
        </label>
        <menu>
          <NKLButton :disabled="count <= 2" @click="count--">− remove</NKLButton>
          <NKLButton :disabled="count >= POOL.length" @click="count++">+ add</NKLButton>
        </menu>
      </fieldset>

      <fieldset>
        <legend>Motion</legend>
        <label>
          duration (ms)
          <input v-model.number="duration" type="range" min="0" max="2000" step="10" />
          <span>{{ duration }}</span>
        </label>
        <NKLSelect v-model="easing" label="easing" :options="easingOptions" />
      </fieldset>
    </form>
  </div>
</template>

<style scoped>
#segmented-lab {
  padding: var(--space-6) var(--space-5);
  max-width: 560px;
  margin: 0 auto;

  section {
    display: grid;
    gap: var(--space-3);
    margin-bottom: var(--space-6);
  }

  .stage {
    display: grid;
    place-items: center;
    min-height: 120px;
    overflow-x: auto;

    /* the font slider resizes the labels without touching the options: only the ResizeObserver sees it */
    :deep(.segmented > button) {
      font-size: 1em;
    }
  }

  [role="tabpanel"] {
    font-size: var(--text-m);
    color: var(--text);

    strong {
      color: var(--text-h);
    }
  }

  output {
    display: flex;
    justify-content: center;

    code {
      font-size: var(--text-xs);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-s);
      background: var(--accent-bg);
      color: var(--accent);
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

    menu {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      padding: 0;
      margin: 0;
    }
  }
}
</style>
