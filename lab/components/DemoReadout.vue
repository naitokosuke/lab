<script setup lang="ts">
/** A row of live values, each a `<code>` chip */
withDefaults(defineProps<{ columns?: number }>(), { columns: 3 });
</script>

<template>
  <output class="demo-readout" :style="{ '--columns': columns }">
    <slot />
  </output>
</template>

<style scoped>
.demo-readout {
  display: grid;
  grid-template-columns: repeat(var(--columns), 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-5);

  :slotted(code) {
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-s);
    background: var(--accent-bg);
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }
}
</style>
