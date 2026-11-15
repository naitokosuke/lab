<script setup lang="ts">
/** A stack of controls that act as they change; Enter in a field never submits it */
defineSlots<{ default(): unknown }>();
</script>

<template>
  <form class="control-panel" @submit.prevent>
    <slot />
  </form>
</template>

<style scoped>
.control-panel {
  display: grid;
  gap: var(--space-4);
}
</style>
