<script setup lang="ts">
import { ref } from "vue";

definePage({
  meta: {
    title: "Counter",
    description: "シンプルなリアクティブカウンター",
    tags: ["basics", "reactivity"],
  },
});

const count = ref(0);
</script>

<template>
  <div class="counter-lab">
    <h2>Counter</h2>
    <button class="counter-btn" @click="count++">Count is {{ count }}</button>
  </div>
</template>

<style scoped>
.counter-lab {
  padding: 32px 24px;
}

.counter-btn {
  font-family: var(--mono);
  font-size: 16px;
  padding: 8px 16px;
  border-radius: 6px;
  border: 2px solid transparent;
  color: var(--accent);
  background: var(--accent-bg);
  cursor: pointer;
  transition: border-color 0.2s;
}

.counter-btn:hover {
  border-color: var(--accent-border);
}
</style>
