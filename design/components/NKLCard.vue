<template>
  <article class="nkl-card">
    <slot />
  </article>
</template>

<style scoped>
.nkl-card {
  padding: var(--space-5);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-l);
  transition:
    translate var(--duration-l) var(--ease-out),
    border-color var(--duration-l),
    box-shadow var(--duration-l);

  &:hover {
    translate: 0 var(--lift);
    border-color: var(--accent-border);
    box-shadow: var(--shadow);
  }

  &:active {
    translate: 0 0;
    transition-duration: var(--duration-xs);
  }
}
</style>
