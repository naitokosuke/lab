<script lang="ts">
import { computed, ref, type ComputedRef } from "vue";
import { NKLSelect } from "@lab/design/components";
import { treeVariants, type TreeVariant, type TreeVariantId } from "../../feature/tree/variants";

type VariantSlotCtx = {
  value: ComputedRef<TreeVariant>;
  /** id of the variant the *other* slot has — must be disabled in this slot's selector. */
  excluded: ComputedRef<TreeVariantId>;
  set: (id: TreeVariantId) => void;
};

const byId = new Map(treeVariants.map((v) => [v.id, v]));

/**
 * Pair of variant slots that stay mutually exclusive by *exclusion*: each side
 * exposes the other side's current id as `excluded`, so the UI can disable that
 * option in its selector. `set` rejects the excluded id defensively. No swap,
 * no surprise reshuffling.
 */
function useExclusiveVariantPair(
  initialLeft: TreeVariantId,
  initialRight: TreeVariantId,
): {
  leftCtx: VariantSlotCtx;
  rightCtx: VariantSlotCtx;
} {
  if (initialLeft === initialRight) {
    throw new Error("useExclusiveVariantPair: initial values must differ");
  }

  const leftId = ref<TreeVariantId>(initialLeft);
  const rightId = ref<TreeVariantId>(initialRight);

  const makeCtx = (self: typeof leftId, other: typeof rightId): VariantSlotCtx => ({
    value: computed(() => byId.get(self.value)!),
    excluded: computed(() => other.value),
    set: (id) => {
      if (id === other.value) return;
      self.value = id;
    },
  });

  return {
    leftCtx: makeCtx(leftId, rightId),
    rightCtx: makeCtx(rightId, leftId),
  };
}
</script>

<script setup lang="ts">
const { leftCtx, rightCtx } = useExclusiveVariantPair("nested", "flat-virtual");

const leftOptions = computed(() =>
  treeVariants.map((v) => ({
    value: v.id,
    label: v.label,
    disabled: v.id === leftCtx.excluded.value,
  })),
);
const rightOptions = computed(() =>
  treeVariants.map((v) => ({
    value: v.id,
    label: v.label,
    disabled: v.id === rightCtx.excluded.value,
  })),
);
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
            :model-value="leftCtx.value.value.id"
            label="Left variant"
            :options="leftOptions"
            @update:model-value="leftCtx.set"
          />
        </div>
        <div :key="leftCtx.value.value.id" class="pane-body">
          <component :is="leftCtx.value.value.component" />
        </div>
      </section>
      <section class="pane">
        <div class="pane-header">
          <NKLSelect
            :model-value="rightCtx.value.value.id"
            label="Right variant"
            :options="rightOptions"
            @update:model-value="rightCtx.set"
          />
        </div>
        <div :key="rightCtx.value.value.id" class="pane-body">
          <component :is="rightCtx.value.value.component" />
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
