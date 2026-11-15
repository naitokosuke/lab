<script setup lang="ts">
import type { LabLayout } from "../pages/meta";

/** Frames a lab page in a centred column under its title */
defineProps<{ title: string; width: Exclude<LabLayout, "fullscreen"> }>();
defineSlots<{ default(): unknown }>();
</script>

<template>
  <main class="column-layout" :data-width="width">
    <h2>{{ title }}</h2>
    <slot />
  </main>
</template>

<style scoped>
.column-layout {
  padding: var(--space-6) var(--space-5);
  max-width: var(--layout-width-wide);
  margin: 0 auto;

  &[data-width="narrow"] {
    max-width: var(--layout-width-narrow);
  }

  &[data-width="medium"] {
    max-width: var(--layout-width-medium);
  }
}
</style>
