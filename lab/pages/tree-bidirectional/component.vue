<script setup lang="ts">
import { provide, ref } from "vue";
import { NKLButton } from "@lab/design/components";
import { TreeBreadcrumb, TreeChip, TreeFilter, TreeShell } from "../../shared/tree/ui";
import { biCtxKey } from "./ctx";
import { serializeWithoutParent, useBidirectionalTree } from "./composable";
import TreeNode from "./TreeNode.vue";

const tree = useBidirectionalTree();

provide(biCtxKey, {
  toggle: tree.toggle,
  select: tree.select,
  filteredChildren: tree.filteredChildren,
});

// JSON.stringify cycle demo
const stringifyError = ref<string | null>(null);
const customSerialized = ref<string | null>(null);
function tryNaiveStringify() {
  stringifyError.value = null;
  customSerialized.value = null;
  const r = tree.roots.value[0];
  if (!r) return;
  try {
    JSON.stringify(r);
    stringifyError.value = "(no error — unexpected)";
  } catch (err) {
    stringifyError.value = err instanceof Error ? err.message : String(err);
  }
}
function tryCustomStringify() {
  customSerialized.value = null;
  const r = tree.roots.value[0];
  if (!r) return;
  const out = serializeWithoutParent(r);
  customSerialized.value = out.length > 360 ? `${out.slice(0, 360)}…` : out;
}
</script>

<template>
  <TreeShell
    title="Tree — Bidirectional"
    description="Each BiNode carries both children and a parent backref. Ancestor walks (breadcrumb / reveal) are O(depth). Refresh reconciles by id and mutates existing objects in place, so reference identity survives. The cost: a cycle that breaks naive JSON.stringify."
  >
    <template #controls>
      <NKLButton :disabled="tree.loading.value" @click="tree.refresh()">Refresh</NKLButton>
      <NKLButton @click="tree.expandAll()">Expand all</NKLButton>
      <NKLButton @click="tree.collapseAll()">Collapse all</NKLButton>
      <TreeFilter v-model="tree.filter.value" />
    </template>

    <template #stats>
      <TreeChip :value="tree.totalNodes.value" label="nodes" emphasis />
      <TreeChip :value="tree.selectedId.value ? 1 : 0" label="selected" />
      <TreeChip :value="`#${tree.seed.value}`" label="seed" />
      <TreeChip
        v-if="tree.identityProbe.value.sameRef !== null"
        :value="tree.identityProbe.value.sameRef ? 'same ✓' : 'replaced ✗'"
        label="identity"
        :emphasis="tree.identityProbe.value.sameRef === true"
      />
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

    <template #detail>
      <section class="probe">
        <h3>JSON.stringify on a cyclic structure</h3>
        <p>
          Parent ↔ children form a cycle. Naive JSON.stringify throws; a replacer that drops parent
          works.
        </p>
        <menu class="probe-controls">
          <NKLButton @click="tryNaiveStringify()">Try JSON.stringify</NKLButton>
          <NKLButton @click="tryCustomStringify()">Use custom serializer</NKLButton>
        </menu>
        <pre v-if="stringifyError" class="err">{{ stringifyError }}</pre>
        <pre v-if="customSerialized" class="ok-pre">{{ customSerialized }}</pre>
      </section>
    </template>
  </TreeShell>
</template>

<style scoped>
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.probe {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-m);
  background: var(--bg);
  display: grid;
  gap: var(--space-2);

  h3 {
    margin: 0;
    font-size: var(--text-m);
    color: var(--text-h);
  }
  p {
    margin: 0;
    color: var(--text);
    font-size: var(--text-s);
    line-height: 1.5;
  }
}
.probe-controls {
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.err,
.ok-pre {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-s);
  font-family: var(--mono);
  font-size: var(--text-xs);
  line-height: 1.4;
  white-space: pre-wrap;
  overflow: auto;
  max-block-size: 240px;
}
.err {
  background: color-mix(in oklab, #c0392b 12%, transparent);
  color: #c0392b;
  border: 1px solid color-mix(in oklab, #c0392b 30%, transparent);
}
.ok-pre {
  background: color-mix(in oklab, var(--accent-bg) 50%, transparent);
  color: var(--text-h);
  border: 1px solid var(--accent-border);
}
</style>
