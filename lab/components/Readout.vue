<script setup lang="ts">
/** Live values, each a `<code>` chip, laid out in `columns` equal columns */
const { columns = 3 } = defineProps<{ columns?: number }>();
defineSlots<{ default(): unknown }>();
</script>

<template>
  <output class="readout" :style="{ '--readout-columns': columns }">
    <slot />
  </output>
</template>

<style scoped>
.readout {
  display: grid;
  grid-template-columns: repeat(var(--readout-columns), 1fr);
  gap: var(--space-2);

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
