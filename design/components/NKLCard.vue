<script setup lang="ts">
defineOptions({ name: "NKLCard" });
</script>

<template>
  <article class="nkl-card">
    <slot />
  </article>
</template>

<style scoped>
.nkl-card {
  padding: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-l);
  transition:
    translate 0.25s cubic-bezier(0.33, 1, 0.68, 1),
    border-color 0.25s,
    box-shadow 0.25s;

  &:hover {
    translate: 0 -2px;
    border-color: var(--accent-border);
    box-shadow: var(--shadow);
  }

  &:active {
    translate: 0 0;
    transition-duration: 0.1s;
  }
}
</style>
