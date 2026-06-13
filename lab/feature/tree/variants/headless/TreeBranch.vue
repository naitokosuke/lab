<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, provide } from "vue";
import { TreeRow } from "../../core/ui";
import type { RawNode } from "../../core";
import { groupCtxKey, useRootCtx } from "./ctx";
import TreeBranch from "./TreeBranch.vue";

const props = defineProps<{ item: RawNode; depth?: number }>();

const root = useRootCtx();
const parentGroup = inject(groupCtxKey, null);
const depth = computed(() => props.depth ?? 0);
const hasChildren = computed(() => (props.item.children?.length ?? 0) > 0);

// 自分を Root に登録 — DOM の compound-component nesting から hierarchy を作る
const unregister = root.registerItem(props.item.id, {
  id: props.item.id,
  hasChildren: hasChildren.value,
  depth: depth.value,
  parentId: parentGroup?.groupId ?? null,
});
onMounted(() => {
  root.setParent(props.item.id, parentGroup?.groupId ?? null);
});
onUnmounted(unregister);

// 子の inject 用に自分の groupId を provide
provide(groupCtxKey, { groupId: props.item.id });

const isOpen = computed(() => root.isOpen(props.item.id));
const isSelected = computed(() => root.isSelected(props.item.id));
const isFocused = computed(() => root.focusedId.value === props.item.id);
</script>

<template>
  <div
    :data-treeitem-id="item.id"
    role="treeitem"
    :aria-level="depth + 1"
    :aria-expanded="hasChildren ? isOpen : undefined"
    :aria-selected="isSelected || undefined"
    :tabindex="isFocused ? 0 : -1"
    @focus="root.focus(item.id)"
  >
    <TreeRow
      :title="item.title"
      :depth="depth"
      :has-children="hasChildren"
      :is-opened="isOpen"
      :is-selected="isSelected"
      @toggle="root.toggle(item.id)"
      @select="root.select(item.id)"
    />
    <div v-if="hasChildren && isOpen" role="group">
      <TreeBranch v-for="child in item.children" :key="child.id" :item="child" :depth="depth + 1" />
    </div>
  </div>
</template>

<style scoped>
[role="treeitem"]:focus {
  outline: none;
}
[role="treeitem"]:focus-visible :deep(.row) {
  box-shadow: 0 0 0 2px var(--accent);
}
</style>
