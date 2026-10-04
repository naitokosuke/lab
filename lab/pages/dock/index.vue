<script setup lang="ts">
import { computed, ref } from "vue";
import { NKLButton, NKLRadioGroup, NKLSelect } from "@lab/design/components";
import Dock from "./component.vue";
import DockDivider from "./DockDivider.vue";
import DockGroup from "./DockGroup.vue";
import DockItem from "./DockItem.vue";

type Item = { id: string; label: string; d: string };

// 24×24 stroked outlines
const places: Item[] = [
  { id: "home", label: "Home", d: "M3 11 12 3l9 8v10h-6v-6H9v6H3z" },
  { id: "search", label: "Search", d: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.35-4.35" },
  { id: "map", label: "Map", d: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14" },
  { id: "calendar", label: "Calendar", d: "M4 6h16v14H4zm0 4h16M8 3v4m8-4v4" },
];
const room: Item[] = [
  { id: "notes", label: "Notes", d: "M6 3h9l3 3v15H6zm3 7h6m-6 4h6m-6 4h4" },
  { id: "photos", label: "Photos", d: "M4 5h16v14H4zm0 11 5-5 4 4 2-2 5 5" },
  { id: "chat", label: "Chat", d: "M4 5h16v11H9l-5 4z" },
];
const settings: Item = { id: "settings", label: "Settings", d: "M4 7h16M4 17h16M9 4v6m6 4v6" };
const all = [...places, ...room, settings];

const current = ref("home");
const currentLabel = computed(() => all.find((i) => i.id === current.value)?.label ?? "—");

const reach = ref(120);
const grow = ref(0.55);

type Preset = "dock" | "subtle" | "wide" | "off" | "custom";
const presets = {
  dock: { reach: 120, grow: 0.55 },
  subtle: { reach: 80, grow: 0.25 },
  wide: { reach: 220, grow: 1 },
  off: { reach: 120, grow: 0 },
} as const satisfies Record<Exclude<Preset, "custom">, { reach: number; grow: number }>;
const presetOptions = [
  { value: "dock", label: "dock (120 / 0.55)" },
  { value: "subtle", label: "subtle (80 / 0.25)" },
  { value: "wide", label: "wide (220 / 1)" },
  { value: "off", label: "off (grow 0)" },
  { value: "custom", label: "custom", disabled: true },
] as const satisfies ReadonlyArray<{ value: Preset; label: string; disabled?: boolean }>;
/** The preset the sliders are on ("custom" when none), and picking one moves both sliders */
const presetCtx = (() => {
  const value = computed<Preset>(() => {
    const hit = Object.entries(presets).find(
      ([, p]) => p.reach === reach.value && p.grow === grow.value,
    );
    return (hit?.[0] as Preset | undefined) ?? "custom";
  });
  const set = (p: Preset) => {
    if (p === "custom") return;
    reach.value = presets[p].reach;
    grow.value = presets[p].grow;
  };
  return { value, set };
})();

const away = ref(false);

type Fold = "open" | "folded";
const fold = ref<Fold>("open");
const foldOptions = [
  { value: "open", label: "Open", description: "Notes, Photos, Chat in the dock" },
  { value: "folded", label: "Folded", description: "the group folds away, divider and all" },
] as const satisfies ReadonlyArray<{ value: Fold; label: string; description: string }>;
</script>

<template>
  <div id="dock-lab">
    <h2>Dock</h2>

    <section class="stage">
      <p aria-live="polite">
        <small>current</small>
        <strong>{{ currentLabel }}</strong>
      </p>

      <Dock label="Main" :away="away" :reach="reach" :grow="grow">
        <DockItem
          v-for="i in places"
          :key="i.id"
          :label="i.label"
          :current="current === i.id"
          @click="current = i.id"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="i.d" /></svg>
        </DockItem>
        <DockGroup :open="fold === 'open'">
          <DockItem
            v-for="i in room"
            :key="i.id"
            :label="i.label"
            :current="current === i.id"
            @click="current = i.id"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="i.d" /></svg>
          </DockItem>
        </DockGroup>
        <DockDivider />
        <DockItem
          :label="settings.label"
          :current="current === settings.id"
          @click="current = settings.id"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="settings.d" /></svg>
        </DockItem>
      </Dock>
    </section>

    <output>
      <code>reach: {{ reach }}px</code>
      <code>grow: ×{{ (1 + grow).toFixed(2) }}</code>
      <code>{{ away ? "away" : "up" }}</code>
    </output>

    <form @submit.prevent>
      <fieldset>
        <legend>Magnify</legend>
        <NKLSelect
          :model-value="presetCtx.value.value"
          label="preset"
          :options="presetOptions"
          @update:model-value="presetCtx.set"
        />
        <label>
          reach (px)
          <input v-model.number="reach" type="range" min="40" max="300" step="10" />
          <span>{{ reach }}</span>
        </label>
        <label>
          grow
          <input v-model.number="grow" type="range" min="0" max="1.5" step="0.05" />
          <span>{{ grow.toFixed(2) }}</span>
        </label>
      </fieldset>

      <NKLRadioGroup v-model="fold" name="fold" legend="Group" :options="foldOptions" />

      <fieldset>
        <legend>Away</legend>
        <menu>
          <NKLButton type="button" :aria-pressed="away" @click="away = !away">
            {{ away ? "Bring the dock back" : "Send the dock away" }}
          </NKLButton>
        </menu>
      </fieldset>
    </form>
  </div>
</template>

<style scoped>
#dock-lab {
  padding: var(--space-6) var(--space-5);
  max-width: 640px;
  margin: 0 auto;

  /* a framed screen; the dock floats at its bottom middle, and sinks below its edge */
  .stage {
    position: relative;
    display: grid;
    place-items: center;
    height: 340px;
    margin: var(--space-5) 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-l);
    overflow: clip;
    /* something under the glass for it to blur */
    background:
      radial-gradient(circle at 20% 85%, oklch(0.75 0.12 250 / 0.45), transparent 35%),
      radial-gradient(circle at 75% 90%, oklch(0.8 0.12 30 / 0.4), transparent 30%),
      radial-gradient(circle at 50% 100%, oklch(0.8 0.12 150 / 0.35), transparent 40%),
      radial-gradient(circle, var(--border) 1px, transparent 1px) 0 0 / 16px 16px,
      var(--bg);

    p {
      display: grid;
      justify-items: center;
      gap: var(--space-1);
      margin: 0 0 var(--space-7);

      small {
        font-family: var(--mono);
        font-size: var(--text-xs);
        color: var(--text);
      }

      strong {
        font-size: 40px;
        font-weight: 700;
        color: var(--text-h);
      }
    }

    svg {
      width: 22px;
      height: 22px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
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

    label:has(input[type="range"]) {
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
