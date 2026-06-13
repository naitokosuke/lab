<script setup lang="ts">
import { computed, inject } from "vue";
import { TreeRow } from "../../core/ui";
import type { RawNode } from "../../core";
import { nestedCtxKey } from "./ctx";
import TreeNode from "./TreeNode.vue";

const props = defineProps<{
  node: RawNode;
  depth: number;
}>();

const ctx = inject(nestedCtxKey);
if (!ctx) throw new Error("TreeNode must be used inside <component.vue>");

const hasChildren = computed(() => (props.node.children?.length ?? 0) > 0);
const isOpened = computed(() => ctx.openedIds.value.has(props.node.id));
const isSelected = computed(() => ctx.selectedId.value === props.node.id);
</script>

<template>
  <li>
    <TreeRow
      :title="node.title"
      :depth="depth"
      :has-children="hasChildren"
      :is-opened="isOpened"
      :is-selected="isSelected"
      @toggle="ctx.toggle(node.id)"
      @select="ctx.select(node.id)"
    />
    <ul v-if="hasChildren && isOpened">
      <TreeNode v-for="child in node.children" :key="child.id" :node="child" :depth="depth + 1" />
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
