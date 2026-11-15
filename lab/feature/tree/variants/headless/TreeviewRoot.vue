<script setup lang="ts">
import { onMounted, ref, toRef, watch } from "vue";
import { provideRoot, type OpenMode, type SelectionMode } from "./ctx";

const props = defineProps<{
  openMode: OpenMode;
  selectionMode: SelectionMode;
}>();

const rootEl = ref<HTMLElement | null>(null);
const ctx = provideRoot({
  openMode: toRef(props, "openMode"),
  selectionMode: toRef(props, "selectionMode"),
});

defineExpose({ ctx });

// 描画後 DOM focus を同期
watch(
  () => ctx.focusedId.value,
  (id) => {
    if (id === null || rootEl.value === null) return;
    const node = rootEl.value.querySelector<HTMLElement>(`[data-treeitem-id="${id}"]`);
    node?.focus();
  },
);

onMounted(() => {
  if (rootEl.value !== null && ctx.visibleOrderedIds.value.length > 0) {
    ctx.focus(ctx.visibleOrderedIds.value[0] ?? null);
  }
});
</script>

<template>
  <div
    ref="rootEl"
    role="tree"
    :aria-multiselectable="selectionMode !== 'leaf' || undefined"
  >
    <slot />
  </div>
</template>
