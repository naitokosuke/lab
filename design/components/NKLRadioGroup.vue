<script setup lang="ts" generic="T extends string">
defineOptions({ name: "NKLRadioGroup" });

const model = defineModel<T>({ required: true });

defineProps<{
  name: string;
  options: ReadonlyArray<{ value: T; label: string; description?: string }>;
  legend?: string;
}>();
</script>

<template>
  <fieldset class="nkl-radio-group" role="radiogroup">
    <legend v-if="legend">{{ legend }}</legend>
    <div class="options">
      <label v-for="opt in options" :key="opt.value" :class="{ active: model === opt.value }">
        <input v-model="model" type="radio" :name="name" :value="opt.value" />
        <span class="label">{{ opt.label }}</span>
        <span v-if="opt.description" class="description">{{ opt.description }}</span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.nkl-radio-group {
  border: none;
  padding: 0;
  margin: 0;
  min-inline-size: 0;

  legend {
    font-family: var(--mono);
    font-size: var(--text-xs);
    color: var(--text-muted, var(--text));
    margin-bottom: var(--space-2);
    padding: 0;
  }

  .options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  label {
    display: inline-flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-m);
    border: 1px solid var(--border);
    background: var(--surface, transparent);
    cursor: pointer;
    font-family: var(--mono);
    font-size: var(--text-s);
    transition:
      border-color 0.15s,
      background 0.15s;

    &:hover {
      border-color: var(--accent-border);
    }

    &:has(input:focus-visible) {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    &.active {
      border-color: var(--accent-border);
      background: var(--accent-bg);
      color: var(--accent);
    }

    input {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .description {
      font-size: var(--text-xs);
      color: var(--text-muted, var(--text));
      opacity: 0.8;
    }
  }
}
</style>
