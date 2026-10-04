<script setup lang="ts">
/** The page a tab list shows */
defineSlots<{ default(): unknown }>();
</script>

<template>
  <div role="tabpanel"><slot></slot></div>
</template>
