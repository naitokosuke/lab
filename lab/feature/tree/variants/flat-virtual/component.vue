<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { NKLButton } from "@lab/design/components";
import { TreeChip, TreeRow, TreeShell } from "../../core/ui";
import { useFlatTree } from "./composable";

const tree = useFlatTree(10_000);
const scrollEl = useTemplateRef<HTMLElement>("scrollEl");

const virtualizer = useVirtualizer(
  computed(() => ({
    count: tree.flat.value.length,
    getScrollElement: () => scrollEl.value,
    estimateSize: () => 28,
    overscan: 12,
  })),
);

const virtualItems = computed(() => virtualizer.value.getVirtualItems());
const totalSize = computed(() => virtualizer.value.getTotalSize());
</script>

<template>
  <TreeShell
    title="Tree — Flat + Virtual"
    description="Arbitrarily deep tree flattened into a 1D array; each row carries its depth integer. @tanstack/vue-virtual renders only viewport rows — DOM node count stays O(viewport) even at 50k nodes. Trade-off: cannot represent DAGs (same id can't appear twice as separate rows here)."
  >
    <template #controls>
      <NKLButton @click="tree.setSize(10_000)">10k nodes</NKLButton>
      <NKLButton @click="tree.setSize(25_000)">25k nodes</NKLButton>
      <NKLButton @click="tree.setSize(50_000)">50k nodes</NKLButton>
      <NKLButton @click="tree.expandAll()">Expand all</NKLButton>
      <NKLButton @click="tree.collapseAll()">Collapse all</NKLButton>
    </template>

    <template #stats>
      <TreeChip :value="tree.totalSource.value" label="source nodes" emphasis />
      <TreeChip :value="tree.visibleCount.value" label="flat rows" />
      <TreeChip :value="virtualItems.length" label="rendered" />
      <TreeChip
        v-if="tree.lastToggleMs.value !== null"
        :value="`${tree.lastToggleMs.value.toFixed(1)}ms`"
        label="last toggle"
      />
      <TreeChip
        v-if="tree.lastBulkMs.value !== null"
        :value="`${tree.lastBulkMs.value.toFixed(1)}ms`"
        label="bulk op"
      />
      <TreeChip :value="`${tree.fps.value}`" label="fps" />
    </template>

    <template #breadcrumb>
      <span class="muted">
        No selection — this demo focuses on raw render performance.
        {{ tree.totalSource.value }} source nodes / {{ tree.visibleCount.value }} flat rows.
      </span>
    </template>

    <template #tree>
      <div ref="scrollEl" class="tree-scroll">
        <div class="canvas" :style="{ height: `${totalSize}px` }">
          <div
            v-for="vi in virtualItems"
            :key="vi.key"
            class="vrow"
            :style="{ transform: `translateY(${vi.start}px)`, height: `${vi.size}px` }"
          >
            <TreeRow
              :title="tree.flat.value[vi.index]!.title"
              :depth="tree.flat.value[vi.index]!.depth"
              :has-children="tree.flat.value[vi.index]!.hasChildren"
              :is-opened="tree.openedIds.value.has(tree.flat.value[vi.index]!.id)"
              :is-selected="false"
              @toggle="tree.toggle(tree.flat.value[vi.index]!.id)"
              @select="tree.toggle(tree.flat.value[vi.index]!.id)"
            />
          </div>
        </div>
      </div>
    </template>
  </TreeShell>
</template>

<style scoped>
.canvas {
  position: relative;
  inline-size: 100%;
}
.vrow {
  position: absolute;
  inset-inline: 0;
  inset-block-start: 0;
}
.muted {
  color: var(--text);
  opacity: 0.75;
  font-style: italic;
  font-family: var(--sans);
}
</style>
