<script setup lang="ts">
/** A bordered group of controls under a legend */
defineProps<{ legend: string }>();
defineSlots<{ default(): unknown }>();
</script>

<template>
  <fieldset class="fieldset">
    <legend>{{ legend }}</legend>
    <slot />
  </fieldset>
</template>

<style scoped>
.fieldset {
  --fieldset-legend-weight: 600;

  display: grid;
  gap: var(--space-3);
  margin: 0;
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-l);
  padding: var(--space-4);

  legend {
    font-size: var(--text-m);
    font-weight: var(--fieldset-legend-weight);
    color: var(--text-h);
    padding: 0 var(--space-2);
  }
}
</style>
