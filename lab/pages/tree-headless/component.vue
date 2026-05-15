<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { NKLButton } from "@lab/design/components";
import { TreeChip, TreeShell } from "../../shared/tree/ui";
import type { OpenMode, SelectionMode } from "./ctx";
import { useHeadlessTree } from "./composable";
import TreeBranch from "./TreeBranch.vue";
import TreeviewRoot from "./TreeviewRoot.vue";

const tree = useHeadlessTree();
const openMode = ref<OpenMode>("multiple");
const selectionMode = ref<SelectionMode>("cascade");

const rootRef = useTemplateRef<{ ctx: import("./ctx").RootCtx } | null>("rootRef");

// データ到着後に depth<=1 を open。ノードは TreeBranch がマウント時に
// register するので、nextTick を一段挟む。
watch(
  () => tree.roots.value,
  async (roots) => {
    await nextTick();
    const r = rootRef.value;
    if (!r) return;
    function visit(node: import("../../shared/tree").RawNode, depth: number) {
      if (depth <= 1 && (node.children?.length ?? 0) > 0) {
        if (!r!.ctx.isOpen(node.id)) r!.ctx.toggle(node.id);
      }
      for (const c of node.children ?? []) visit(c, depth + 1);
    }
    for (const root of roots) visit(root, 0);
  },
  { immediate: true },
);

const focusedItem = computed(() => {
  const r = rootRef.value;
  if (!r) return null;
  const id = r.ctx.focusedId.value;
  if (!id) return null;
  return { id, info: r.ctx.itemInfo(id) };
});

function revealRandom() {
  const r = rootRef.value;
  if (!r) return;
  const ids: string[] = [];
  function walk(node: import("../../shared/tree").RawNode) {
    ids.push(node.id);
    for (const c of node.children ?? []) walk(c);
  }
  for (const root of tree.roots.value) walk(root);
  if (ids.length === 0) return;
  const target = ids[Math.floor(Math.random() * ids.length)]!;
  // 祖先を全部開いてから focus
  let cur = target;
  const chain: string[] = [];
  while (cur) {
    const info = r.ctx.itemInfo(cur);
    if (!info?.parentId) break;
    chain.push(info.parentId);
    cur = info.parentId;
  }
  for (const a of chain) {
    if (!r.ctx.isOpen(a)) r.ctx.toggle(a);
  }
  r.ctx.focus(target);
}
</script>

<template>
  <TreeShell
    title="Tree — Headless"
    description="Hand-rolled headless compound components. Hierarchy lives in DOM nesting (Treeview.Root / Group / Item), not in a single data prop. State flows through provide/inject. Same row visual as the other patterns — different way to express the structure."
  >
    <template #controls>
      <NKLButton :disabled="tree.loading.value" @click="tree.refresh()">Refresh</NKLButton>
      <div class="seg" role="radiogroup" aria-label="Open mode">
        <button
          v-for="m in ['multiple', 'single', 'all'] as const"
          :key="m"
          :data-active="openMode === m || undefined"
          @click="openMode = m"
        >
          {{ m }}
        </button>
      </div>
      <div class="seg" role="radiogroup" aria-label="Selection mode">
        <button
          v-for="m in ['cascade', 'independent', 'leaf'] as const"
          :key="m"
          :data-active="selectionMode === m || undefined"
          @click="selectionMode = m"
        >
          {{ m }}
        </button>
      </div>
      <NKLButton @click="revealRandom()">Reveal random</NKLButton>
    </template>

    <template #stats>
      <TreeChip
        :value="rootRef ? rootRef.ctx.visibleOrderedIds.value.length : 0"
        label="visible"
        emphasis
      />
      <TreeChip :value="rootRef ? rootRef.ctx.selectedIds.value.size : 0" label="selected" />
      <TreeChip :value="openMode" label="open" />
      <TreeChip :value="selectionMode" label="selection" />
    </template>

    <template #breadcrumb>
      <template v-if="focusedItem">
        <span class="aria-label">role=</span>
        <code>treeitem</code>
        <span class="aria-label">level=</span>
        <code>{{ (focusedItem.info?.depth ?? 0) + 1 }}</code>
        <span class="aria-label">expanded=</span>
        <code>{{
          focusedItem.info?.hasChildren
            ? rootRef!.ctx.isOpen(focusedItem.id)
              ? "true"
              : "false"
            : "—"
        }}</code>
        <span class="aria-label">selected=</span>
        <code>{{ rootRef!.ctx.isSelected(focusedItem.id) ? "true" : "false" }}</code>
      </template>
      <span v-else class="empty">Focus a tree row (Tab into it, then ↑ ↓ → ← Space).</span>
    </template>

    <template #tree>
      <div class="tree-scroll">
        <TreeviewRoot ref="rootRef" :open-mode="openMode" :selection-mode="selectionMode">
          <TreeBranch v-for="root in tree.roots.value" :key="root.id" :item="root" :depth="0" />
        </TreeviewRoot>
      </div>
    </template>
  </TreeShell>
</template>

<style scoped>
.seg {
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  overflow: hidden;

  button {
    font: inherit;
    font-family: var(--mono);
    font-size: var(--text-s);
    color: var(--text);
    background: transparent;
    border: 0;
    padding: 4px var(--space-3);
    cursor: pointer;

    & + button {
      border-inline-start: 1px solid var(--border);
    }
    &:hover {
      color: var(--text-h);
    }
    &[data-active] {
      background: var(--accent-bg);
      color: var(--accent);
    }
    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: -2px;
    }
  }
}

code {
  font-family: var(--mono);
  font-size: 0.9em;
  padding: 0 var(--space-1);
  background: var(--accent-bg);
  color: var(--accent);
  border-radius: var(--radius-s);
}
.aria-label {
  color: var(--text);
  opacity: 0.65;
  font-family: var(--sans);
}
.empty {
  color: var(--text);
  opacity: 0.7;
  font-style: italic;
  font-family: var(--sans);
}
</style>
