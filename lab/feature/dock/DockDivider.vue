<!-- A thin line between kinds of dock item: places, then settings -->
<template>
  <span aria-hidden="true"></span>
</template>

<style scoped>
span {
  flex-shrink: 0;
  width: var(--border-width);
  height: var(--dock-divider-length);
  margin-inline: var(--dock-divider-margin);
  background: var(--dock-line);
}
</style>
