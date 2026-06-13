<script setup lang="ts">
/** breadcrumb スロット用。ID と title の配列を区切り表示 */
defineProps<{
  /** ルート -> 選択ノード の順 */
  path: readonly { id: string; title: string }[];
}>();
</script>

<template>
  <template v-if="path.length === 0">
    <span class="empty">Click a node title to see its path.</span>
  </template>
  <template v-else>
    <template v-for="(node, i) in path" :key="node.id">
      <span class="crumb">{{ node.title }}</span>
      <span v-if="i < path.length - 1" class="sep" aria-hidden="true">/</span>
    </template>
  </template>
</template>

<style scoped>
.empty {
  color: var(--text);
  opacity: 0.7;
  font-style: italic;
  font-family: var(--sans);
}
.crumb {
  color: var(--text-h);
}
.crumb:last-child {
  color: var(--accent);
  font-weight: 600;
}
.sep {
  color: var(--border);
}
</style>
