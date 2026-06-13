<script setup lang="ts">
defineProps<{
  modelValue: string;
  placeholder?: string;
}>();
defineEmits<{
  "update:modelValue": [string];
}>();
</script>

<template>
  <label class="filter">
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5" />
      <path d="M10.5 10.5 L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>
    <input
      type="search"
      :value="modelValue"
      :placeholder="placeholder ?? 'Filter by title...'"
      aria-label="Filter"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

<style scoped>
.filter {
  flex: 1 1 220px;
  min-inline-size: 200px;
  max-inline-size: 360px;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  background: var(--bg);
  color: var(--text);
  transition: border-color 120ms;

  &:focus-within {
    border-color: var(--accent-border);
    color: var(--text-h);
  }
  svg {
    flex: none;
    inline-size: 0.95em;
    block-size: 0.95em;
    color: inherit;
  }
  input {
    flex: 1;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text-h);
    font: inherit;
    font-family: var(--mono);
    font-size: var(--text-s);
    padding: 0;
    min-inline-size: 0;
  }
  input::placeholder {
    color: var(--text);
    opacity: 0.6;
  }
}
</style>
