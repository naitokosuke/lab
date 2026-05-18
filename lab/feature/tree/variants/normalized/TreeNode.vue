<script setup lang="ts">
import { computed, inject } from "vue";
import { TreeRow } from "../../core/ui";
import type { NodeId } from "../../core";
import { normalizedCtxKey } from "./ctx";
import TreeNode from "./TreeNode.vue";

const props = defineProps<{
  id: NodeId;
  depth: number;
  /** root から自分の親までの id 列。DAG で同じ id でも appearance を区別するのに使う */
  path: readonly NodeId[];
}>();

const ctx = inject(normalizedCtxKey);
if (!ctx) throw new Error("TreeNode must be used inside <component.vue>");

const title = computed(() => ctx.titleOf(props.id));
const childIds = computed(() => ctx.childrenOf(props.id));
const hasChildren = computed(() => childIds.value.length > 0);
const isOpened = computed(() => ctx.openedIds.value.has(props.id));
const appearances = computed(() => ctx.appearanceCount(props.id));
const isSelected = computed(() => {
  const sel = ctx.selectedAppearance.value;
  if (!sel) return false;
  if (sel.id !== props.id) return false;
  // 同じ id を持つ別 appearance を区別: path も一致する場合だけ selected
  if (sel.path.length !== props.path.length) return false;
  for (let i = 0; i < sel.path.length; i++) if (sel.path[i] !== props.path[i]) return false;
  return true;
});

const childPath = computed(() => [...props.path, props.id]);
</script>

<template>
  <li>
    <TreeRow
      :title="title"
      :depth="depth"
      :has-children="hasChildren"
      :is-opened="isOpened"
      :is-selected="isSelected"
      :appearances="appearances"
      @toggle="ctx.toggle(id)"
      @select="ctx.select(id, path)"
    />
    <ul v-if="hasChildren && isOpened">
      <TreeNode
        v-for="cid in childIds"
        :key="`${path.join('>')}>${id}>${cid}`"
        :id="cid"
        :depth="depth + 1"
        :path="childPath"
      />
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
