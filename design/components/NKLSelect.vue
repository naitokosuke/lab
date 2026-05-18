<script setup lang="ts" generic="T extends string">
defineOptions({ name: "NKLSelect" });

const model = defineModel<T>({ required: true });

defineProps<{
  options: ReadonlyArray<{ value: T; label: string; disabled?: boolean }>;
  label?: string;
}>();
</script>

<template>
  <label class="nkl-select">
    <span v-if="label" class="label">{{ label }}</span>
    <select v-model="model">
      <option v-for="opt in options" :key="opt.value" :value="opt.value" :disabled="opt.disabled">
        {{ opt.label }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.nkl-select {
  display: inline-flex;
  flex-direction: column;
  gap: var(--space-1);
  font-family: var(--mono);
  font-size: var(--text-s);
  min-inline-size: 0;

  .label {
    font-size: var(--text-xs);
    color: var(--text-muted, var(--text));
  }

  select {
    appearance: none;
    font: inherit;
    color: var(--accent);
    background: var(--accent-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    padding: var(--space-2) var(--space-7) var(--space-2) var(--space-3);
    cursor: pointer;
    background-image:
      linear-gradient(45deg, transparent 50%, currentColor 50%),
      linear-gradient(135deg, currentColor 50%, transparent 50%);
    background-position:
      calc(100% - var(--space-4)) center,
      calc(100% - var(--space-3)) center;
    background-size:
      5px 5px,
      5px 5px;
    background-repeat: no-repeat;
    transition: border-color 0.15s;

    &:hover {
      border-color: var(--accent-border);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  }
}
</style>
