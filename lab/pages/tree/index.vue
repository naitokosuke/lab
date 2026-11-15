<script setup lang="ts">
import { NKLSelect } from "@lab/design/components";
import { useExclusiveVariantPair, variantOptions } from "../../feature/tree/composable";

const { leftCtx, rightCtx } = useExclusiveVariantPair("nested", "flat-virtual");
const leftOptions = variantOptions(leftCtx);
const rightOptions = variantOptions(rightCtx);
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
          <NKLSelect
            :model-value="leftCtx.variant.value.id"
            label="Left variant"
            :options="leftOptions"
            @update:model-value="leftCtx.set"
          />
        </div>
        <div :key="leftCtx.variant.value.id" class="pane-body">
          <component :is="leftCtx.variant.value.component" />
        </div>
      </section>
      <section class="pane">
        <div class="pane-header">
          <NKLSelect
            :model-value="rightCtx.variant.value.id"
            label="Right variant"
            :options="rightOptions"
            @update:model-value="rightCtx.set"
          />
        </div>
        <div :key="rightCtx.variant.value.id" class="pane-body">
          <component :is="rightCtx.variant.value.component" />
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
    border-block-end: var(--border-width) solid var(--border);

    h1 {
      margin: 0;
      font-size: var(--text-xl);
    }

    p {
      margin: 0;
      color: var(--text-muted);
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
    border-inline-end: var(--border-width) solid var(--border);

    &:last-child {
      border-inline-end: none;
    }
  }

  .pane-header {
    padding: var(--space-3) var(--space-4);
    border-block-end: var(--border-width) solid var(--border);
    background: var(--surface);
  }

  .pane-body {
    overflow: auto;
    min-block-size: 0;
    min-inline-size: 0;
  }
}
</style>
