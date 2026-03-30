<script setup lang="ts">
import { ref } from "vue";
import { NKLButton } from "@lab/design/components";

const count = ref(0);
</script>

<template>
  <div id="counter-lab">
    <h2>Counter</h2>
    <NKLButton @click="count++">Count is {{ count }}</NKLButton>
  </div>
</template>

<style scoped>
#counter-lab {
  padding: var(--space-6) var(--space-5);
}
</style>
