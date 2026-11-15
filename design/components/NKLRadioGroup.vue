<script setup lang="ts" generic="T extends string">
const model = defineModel<T>({ required: true });

defineProps<{
  name: string;
  options: ReadonlyArray<{ value: T; label: string; description?: string }>;
  legend?: string;
}>();
</script>

<template>
  <fieldset class="nkl-radio-group" role="radiogroup">
    <legend v-if="legend !== undefined">{{ legend }}</legend>
    <div class="options">
      <label v-for="opt in options" :key="opt.value" :class="{ active: model === opt.value }">
        <input v-model="model" type="radio" :name="name" :value="opt.value" />
        <span class="label">{{ opt.label }}</span>
        <span v-if="opt.description !== undefined" class="description">{{ opt.description }}</span>
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
    color: var(--text-muted);
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
    border: var(--border-width) solid var(--border);
    background: var(--surface);
    cursor: pointer;
    font-family: var(--mono);
    font-size: var(--text-s);
    transition:
      border-color var(--duration-s),
      background var(--duration-s);

    &:hover {
      border-color: var(--accent-border);
    }

    &:has(input:focus-visible) {
      outline: var(--focus-ring-width) solid var(--accent);
      outline-offset: var(--focus-ring-offset);
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
      color: var(--text-muted);
      opacity: var(--opacity-muted);
    }
  }
}
</style>
