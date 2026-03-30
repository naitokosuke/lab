<script setup lang="ts">
defineOptions({ name: "NKLButton" });
</script>

<template>
  <button class="nkl-button">
    <slot />
  </button>
</template>

<style scoped>
.nkl-button {
  font-family: var(--mono);
  font-size: var(--text-m);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-m);
  border: 1px solid var(--border);
  color: var(--accent);
  background: var(--accent-bg);
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--accent-border);
  }
}
</style>
