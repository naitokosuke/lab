<script setup lang="ts">
defineProps<{ legend: string }>();
</script>

<template>
  <fieldset class="demo-fieldset">
    <legend>{{ legend }}</legend>
    <slot />
  </fieldset>
</template>

<style scoped>
.demo-fieldset {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-l);
  padding: var(--space-4);

  legend {
    font-size: var(--text-m);
    font-weight: 600;
    color: var(--text-h);
    padding: 0 var(--space-2);
  }
}
</style>
