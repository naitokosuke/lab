<script setup lang="ts">
import { computed, provide, ref } from "vue";
import { NKLButton } from "@lab/design/components";
import { TreeBreadcrumb, TreeChip, TreeFilter, TreeShell } from "../../shared/tree/ui";
import { normalizedCtxKey } from "./ctx";
import { useNormalizedTree } from "./composable";
import TreeNode from "./TreeNode.vue";

const tree = useNormalizedTree();

provide(normalizedCtxKey, {
  openedIds: tree.openedIds,
  selectedAppearance: tree.selectedAppearance,
  matchedIds: tree.matchedIds,
  toggle: tree.toggle,
  select: tree.selectAppearance,
  childrenOf: (id) => tree.store.state.childrenIds[id] ?? [],
  titleOf: (id) => tree.store.state.nodes[id]?.title ?? id,
  appearanceCount: tree.store.appearanceCount,
});

const moveSource = ref<string>("");
const moveTarget = ref<string>("");

const allIds = computed(() => Object.keys(tree.store.state.nodes));

function doMove() {
  if (!moveSource.value || !moveTarget.value) return;
  tree.moveNode(moveSource.value, moveTarget.value);
}
function doLink() {
  if (!moveSource.value || !moveTarget.value) return;
  tree.addParentLink(moveSource.value, moveTarget.value);
}
</script>

<template>
  <TreeShell
    title="Tree — Normalized"
    description="Entities stored in dictionaries (nodes / childrenIds / parentIds / rootIds). The same entity can appear under multiple parents (DAG). Recursive components take an id prop — there's no object-identity coupling, so editing a title updates every appearance at once."
  >
    <template #controls>
      <NKLButton :disabled="tree.loading.value" @click="tree.refresh()">Refresh</NKLButton>
      <NKLButton @click="tree.expandAll()">Expand all</NKLButton>
      <NKLButton @click="tree.collapseAll()">Collapse all</NKLButton>
      <TreeFilter v-model="tree.filter.value" />
    </template>

    <template #stats>
      <TreeChip :value="tree.store.totalEntities.value" label="entities" emphasis />
      <TreeChip :value="tree.store.totalAppearances.value" label="appearances" />
      <TreeChip :value="tree.store.dagNodeCount.value" label="DAG nodes" />
      <TreeChip :value="`#${tree.seed.value}`" label="seed" />
    </template>

    <template #breadcrumb>
      <TreeBreadcrumb :path="tree.breadcrumb.value" />
    </template>

    <template #tree>
      <div class="tree-scroll">
        <ul>
          <TreeNode
            v-for="rid in tree.store.state.rootIds"
            :key="rid"
            :id="rid"
            :depth="0"
            :path="[]"
          />
        </ul>
      </div>
    </template>

    <template #detail>
      <section class="ops">
        <h3>Move or link — guarded by cycle prevention</h3>
        <p>
          Moving a node only mutates <code>childrenIds</code>/<code>parentIds</code>; entity bodies
          stay intact. Adding a parent link turns the structure into a DAG (the moved id appears
          under multiple parents).
        </p>
        <div class="ops-controls">
          <label>
            <span>source</span>
            <select v-model="moveSource">
              <option value="">—</option>
              <option v-for="id in allIds" :key="id" :value="id">
                {{ id }} — {{ tree.store.state.nodes[id]?.title }}
              </option>
            </select>
          </label>
          <label>
            <span>new parent</span>
            <select v-model="moveTarget">
              <option value="">—</option>
              <option v-for="id in allIds" :key="id" :value="id">
                {{ id }} — {{ tree.store.state.nodes[id]?.title }}
              </option>
            </select>
          </label>
          <NKLButton @click="doMove()">Move</NKLButton>
          <NKLButton @click="doLink()">Add parent link (DAG)</NKLButton>
        </div>
        <div v-if="tree.toast.value" class="toast" :data-kind="tree.toast.value.kind">
          {{ tree.toast.value.text }}
        </div>
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
.ops {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-m);
  background: var(--bg);
  display: grid;
  gap: var(--space-3);

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
  code {
    font-family: var(--mono);
    font-size: 0.9em;
    padding: 0 var(--space-1);
    background: var(--accent-bg);
    color: var(--accent);
    border-radius: var(--radius-s);
  }
}
.ops-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);

  label {
    display: inline-flex;
    flex-direction: column;
    gap: 2px;
    font-size: var(--text-xs);
    color: var(--text);
  }
  select {
    font: inherit;
    font-family: var(--mono);
    font-size: var(--text-s);
    padding: 4px var(--space-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg);
    color: var(--text-h);
    min-inline-size: 14em;
  }
}
.toast {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-s);
  font-family: var(--mono);
  font-size: var(--text-xs);

  &[data-kind="ok"] {
    background: color-mix(in oklab, var(--accent) 12%, transparent);
    color: var(--accent);
    border: 1px solid var(--accent-border);
  }
  &[data-kind="err"] {
    background: color-mix(in oklab, #c0392b 12%, transparent);
    color: #c0392b;
    border: 1px solid color-mix(in oklab, #c0392b 30%, transparent);
  }
}
</style>
