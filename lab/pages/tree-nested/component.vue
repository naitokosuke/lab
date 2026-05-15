<script setup lang="ts">
import { provide } from "vue";
import { NKLButton } from "@lab/design/components";
import { TreeBreadcrumb, TreeChip, TreeFilter, TreeShell } from "../../shared/tree/ui";
import { nestedCtxKey } from "./ctx";
import { useNestedTree } from "./composable";
import TreeNode from "./TreeNode.vue";

const tree = useNestedTree();

provide(nestedCtxKey, {
  openedIds: tree.openedIds,
  selectedId: tree.selectedId,
  toggle: tree.toggle,
  select: tree.select,
});
</script>

<template>
  <TreeShell
    title="Tree — Nested"
    description="Children-only data shape, rendered by a self-recursive <TreeNode>. UI state (openedIds / selectedIds) lives outside the data, so a fresh-seed refresh — which swaps every node identity — does not blow away your selection."
  >
    <template #controls>
      <NKLButton :disabled="tree.loading.value" @click="tree.refresh()"> Refresh </NKLButton>
      <NKLButton @click="tree.expandAll()">Expand all</NKLButton>
      <NKLButton @click="tree.collapseAll()">Collapse all</NKLButton>
      <TreeFilter v-model="tree.filter.value" />
    </template>

    <template #stats>
      <TreeChip :value="tree.totalNodes.value" label="nodes" emphasis />
      <TreeChip :value="tree.openedIds.value.size" label="opened" />
      <TreeChip :value="tree.selectedId.value ? 1 : 0" label="selected" />
      <TreeChip :value="`#${tree.seed.value}`" label="seed" />
    </template>

    <template #breadcrumb>
      <TreeBreadcrumb :path="tree.breadcrumb.value" />
    </template>

    <template #tree>
      <div class="tree-scroll">
        <ul>
          <TreeNode
            v-for="root in tree.filteredRoots.value"
            :key="root.id"
            :node="root"
            :depth="0"
          />
        </ul>
      </div>
    </template>
  </TreeShell>
</template>

<style scoped>
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
