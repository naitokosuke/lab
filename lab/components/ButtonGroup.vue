<script setup lang="ts">
/** A row of buttons that wraps when it runs out of room */
defineSlots<{ default(): unknown }>();
</script>

<template>
  <menu class="button-group">
    <slot />
  </menu>
</template>

<style scoped>
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
}
</style>
