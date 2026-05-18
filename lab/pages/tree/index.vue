<script setup lang="ts">
import { computed, ref } from "vue";
import { NKLSelect } from "@lab/design/components";
import { treeVariants, type TreeVariantId } from "../../feature/tree/variants";

const leftId = ref<TreeVariantId>("nested");
const rightId = ref<TreeVariantId>("flat-virtual");

const options = treeVariants.map((v) => ({ value: v.id, label: v.label }));

const byId = new Map(treeVariants.map((v) => [v.id, v]));
const left = computed(() => byId.get(leftId.value)!);
const right = computed(() => byId.get(rightId.value)!);
</script>

<template>
  <div id="tree-page">
    <header>
      <h1>Tree</h1>
      <p>Compare two tree-rendering strategies side by side.</p>
    </header>
    <div class="split">
      <section class="pane">
        <div class="pane-header">
          <NKLSelect v-model="leftId" label="Left variant" :options="options" />
        </div>
        <div :key="left.id" class="pane-body">
          <component :is="left.component" />
        </div>
      </section>
      <section class="pane">
        <div class="pane-header">
          <NKLSelect v-model="rightId" label="Right variant" :options="options" />
        </div>
        <div :key="right.id" class="pane-body">
          <component :is="right.component" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
#tree-page {
  display: grid;
  grid-template-rows: auto 1fr;
  block-size: 100dvh;
  inline-size: 100%;
  min-inline-size: 0;

  header {
    padding: var(--space-4) var(--space-5) var(--space-3);
    display: grid;
    gap: var(--space-2);
    border-block-end: 1px solid var(--border);

    h1 {
      margin: 0;
      font-size: var(--text-xl);
    }

    p {
      margin: 0;
      color: var(--text-muted, var(--text));
      font-size: var(--text-s);
    }
  }

  .split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-block-size: 0;
    min-inline-size: 0;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      grid-auto-rows: minmax(0, 1fr);
    }
  }

  .pane {
    display: grid;
    grid-template-rows: auto 1fr;
    min-block-size: 0;
    min-inline-size: 0;
    border-inline-end: 1px solid var(--border);

    &:last-child {
      border-inline-end: none;
    }
  }

  .pane-header {
    padding: var(--space-3) var(--space-4);
    border-block-end: 1px solid var(--border);
    background: var(--surface, transparent);
  }

  .pane-body {
    overflow: auto;
    min-block-size: 0;
    min-inline-size: 0;
  }
}
</style>
