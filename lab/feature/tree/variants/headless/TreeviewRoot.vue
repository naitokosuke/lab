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

// keyboard nav: arrow up/down move focus, right opens, left closes, space/enter selects
function onKeydown(e: KeyboardEvent) {
  const order = ctx.visibleOrderedIds.value;
  if (order.length === 0) return;
  const cur = ctx.focusedId.value;
  const idx = cur ? order.indexOf(cur) : -1;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    const next = order[Math.min(order.length - 1, idx + 1)] ?? order[0]!;
    ctx.focus(next);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    const next = order[Math.max(0, idx - 1)] ?? order[0]!;
    ctx.focus(next);
  } else if (e.key === "Home") {
    e.preventDefault();
    ctx.focus(order[0] ?? null);
  } else if (e.key === "End") {
    e.preventDefault();
    ctx.focus(order[order.length - 1] ?? null);
  } else if (e.key === "ArrowRight" && cur) {
    e.preventDefault();
    const info = ctx.itemInfo(cur);
    if (info?.hasChildren && !ctx.isOpen(cur)) ctx.toggle(cur);
  } else if (e.key === "ArrowLeft" && cur) {
    e.preventDefault();
    const info = ctx.itemInfo(cur);
    if (info?.hasChildren && ctx.isOpen(cur)) ctx.toggle(cur);
    else if (info?.parentId) ctx.focus(info.parentId);
  } else if (e.key === " " || e.key === "Enter") {
    if (cur) {
      e.preventDefault();
      ctx.select(cur);
    }
  }
}

// 描画後 DOM focus を同期
watch(
  () => ctx.focusedId.value,
  (id) => {
    if (!id || !rootEl.value) return;
    const node = rootEl.value.querySelector<HTMLElement>(`[data-treeitem-id="${id}"]`);
    node?.focus();
  },
);

onMounted(() => {
  if (rootEl.value && ctx.visibleOrderedIds.value.length > 0) {
    ctx.focus(ctx.visibleOrderedIds.value[0] ?? null);
  }
});
</script>

<template>
  <div
    ref="rootEl"
    role="tree"
    :aria-multiselectable="selectionMode !== 'leaf' || undefined"
    @keydown="onKeydown"
  >
    <slot />
  </div>
</template>
