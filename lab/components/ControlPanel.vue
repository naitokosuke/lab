<template>
  <form class="demo-controls" @submit.prevent>
    <slot />
  </form>
</template>

<style scoped>
.demo-controls {
  display: grid;
  gap: var(--space-4);
}
</style>
