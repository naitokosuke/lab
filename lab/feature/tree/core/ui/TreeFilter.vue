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
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <circle cx="7" cy="7" fill="none" r="4.5" stroke="currentColor" stroke-width="1.5" />
      <path d="M10.5 10.5 L14 14" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" />
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
  --tree-filter-flex-basis: 220px;
  --tree-filter-min-inline-size: 200px;
  --tree-filter-max-inline-size: 360px;
  --tree-filter-padding-block: 6px;
  --tree-filter-transition-duration: 120ms;
  --tree-filter-icon-size: 0.95em;
  --tree-filter-placeholder-opacity: 0.6;

  flex: 1 1 var(--tree-filter-flex-basis);
  min-inline-size: var(--tree-filter-min-inline-size);
  max-inline-size: var(--tree-filter-max-inline-size);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--tree-filter-padding-block) var(--space-3);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-s);
  background: var(--bg);
  color: var(--text);
  transition: border-color var(--tree-filter-transition-duration);

  &:focus-within {
    border-color: var(--accent-border);
    color: var(--text-h);
  }
  svg {
    flex: none;
    inline-size: var(--tree-filter-icon-size);
    block-size: var(--tree-filter-icon-size);
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
    opacity: var(--tree-filter-placeholder-opacity);
  }
}
</style>
