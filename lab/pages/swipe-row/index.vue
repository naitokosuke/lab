<script setup lang="ts">
import { ref } from "vue";
import { NKLButton, NKLSelect } from "@lab/design/components";
import SwipeRow from "./component.vue";

type Note = { id: number; title: string; detail: string };

const NOTES: readonly Note[] = [
  { id: 1, title: "1日目 京都駅", detail: "11/3(火) 9:30 集合、荷物はコインロッカーへ" },
  { id: 2, title: "伏見稲荷", detail: "千本鳥居は朝のうちに。帰りに稲荷寿司" },
  { id: 3, title: "錦市場", detail: "昼ごはんは食べ歩き、予算 2,000 円" },
  { id: 4, title: "2日目 嵐山", detail: "11/4(水) 竹林の小径 → 渡月橋" },
  { id: 5, title: "宿", detail: "チェックイン 15:00、夕食 19:00" },
];

const notes = ref<Note[]>([...NOTES]);
/** The owner keeps which row is open, so only one is at a time */
const openId = ref<number | null>(null);
const lastAction = ref("—");

const duration = ref(280);
const easing = ref("cubic-bezier(0.22, 1, 0.36, 1)");
const easingOptions = [
  { value: "cubic-bezier(0.22, 1, 0.36, 1)", label: "ease-out-quint" },
  { value: "ease", label: "ease" },
  { value: "ease-in-out", label: "ease-in-out" },
  { value: "linear", label: "linear" },
  { value: "cubic-bezier(0.34, 1.56, 0.64, 1)", label: "back-out" },
];

function toggle(id: number, open: boolean) {
  if (open) openId.value = id;
  else if (openId.value === id) openId.value = null;
}

function edit(note: Note) {
  lastAction.value = `edit #${note.id}`;
  openId.value = null;
}

function remove(note: Note) {
  notes.value = notes.value.filter((n) => n.id !== note.id);
  lastAction.value = `delete #${note.id}`;
  if (openId.value === note.id) openId.value = null;
}

function reset() {
  notes.value = [...NOTES];
  openId.value = null;
  lastAction.value = "reset";
}
</script>

<template>
  <div id="swipe-row-lab">
    <h2>Swipe Row</h2>

    <p class="hint">
      Sliding is touch-only: use a phone, or DevTools' touch emulation, and slide a row left. With a
      mouse or keyboard, each row's ⋯ button opens its actions.
    </p>

    <section>
      <ul>
        <li v-for="note in notes" :key="note.id">
          <SwipeRow
            :open="openId === note.id"
            :duration="duration"
            :easing="easing"
            @toggle="toggle(note.id, $event)"
          >
            <div class="note">
              <div>
                <strong>{{ note.title }}</strong>
                <span>{{ note.detail }}</span>
              </div>
              <button
                type="button"
                class="more"
                :aria-expanded="openId === note.id"
                :aria-label="`Actions for ${note.title}`"
                @click="toggle(note.id, openId !== note.id)"
              >
                ⋯
              </button>
            </div>
            <template #actions>
              <button type="button" class="action edit" @click="edit(note)">Edit</button>
              <button type="button" class="action delete" @click="remove(note)">Delete</button>
            </template>
          </SwipeRow>
        </li>
        <li v-if="notes.length === 0" class="empty">No notes left.</li>
      </ul>
    </section>

    <output>
      <code>open: {{ openId === null ? "none" : `#${openId}` }}</code>
      <code>last: {{ lastAction }}</code>
    </output>

    <form @submit.prevent>
      <fieldset>
        <legend>Rows</legend>
        <menu>
          <NKLButton @click="reset">reset rows</NKLButton>
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
#swipe-row-lab {
  padding: var(--space-6) var(--space-5);
  max-width: 560px;
  margin: 0 auto;

  .hint {
    font-size: var(--text-s);
    color: var(--text);
    margin-bottom: var(--space-4);
  }

  section {
    padding: var(--space-4) 0;

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius-l);
      overflow: hidden;
    }

    li + li {
      border-top: 1px solid var(--border);
    }

    .empty {
      padding: var(--space-4);
      font-size: var(--text-m);
      color: var(--text);
      text-align: center;
    }
  }

  .note {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--bg);

    > div {
      flex: 1;
      display: grid;
      gap: var(--space-1);
      min-width: 0;
    }

    strong {
      font-size: var(--text-l);
      color: var(--text-h);
    }

    span {
      font-size: var(--text-s);
      color: var(--text);
    }
  }

  .more {
    font-size: var(--text-l);
    line-height: 1;
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--accent-bg);
    color: var(--text-h);
    cursor: pointer;
  }

  .action {
    min-width: 64px;
    font-size: var(--text-s);
    font-weight: 600;
    border: none;
    cursor: pointer;
  }

  .edit {
    background: var(--accent-bg);
    color: var(--text-h);
  }

  .delete {
    background: var(--accent);
    color: var(--bg);
  }

  output {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
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

    menu {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      padding: 0;
    }
  }
}
</style>
