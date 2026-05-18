<script setup lang="ts">
import { computed, inject } from "vue";
import { TreeRow } from "../../core/ui";
import type { BiNode } from "./composable";
import { biCtxKey } from "./ctx";
import TreeNode from "./TreeNode.vue";

const props = defineProps<{ node: BiNode; depth: number }>();

const ctx = inject(biCtxKey);
if (!ctx) throw new Error("TreeNode must be used inside <component.vue>");

const children = computed(() => ctx.filteredChildren(props.node));
const hasChildren = computed(() => props.node.children.length > 0);
</script>

<template>
  <li>
    <TreeRow
      :title="node.title"
      :depth="depth"
      :has-children="hasChildren"
      :is-opened="node.isOpened"
      :is-selected="node.isSelected"
      @toggle="ctx.toggle(node.id)"
      @select="ctx.select(node.id)"
    />
    <ul v-if="hasChildren && node.isOpened">
      <TreeNode v-for="child in children" :key="child.id" :node="child" :depth="depth + 1" />
    </ul>
  </li>
</template>

<style scoped>
li {
  list-style: none;
}
ul {
  margin: 0;
  padding: 0;
}
</style>
