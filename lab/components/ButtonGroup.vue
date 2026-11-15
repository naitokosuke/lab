<template>
  <menu class="demo-actions">
    <slot />
  </menu>
</template>

<style scoped>
.demo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
}
</style>
