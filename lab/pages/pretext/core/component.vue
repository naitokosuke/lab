<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from "vue";
import { layoutWithLines, type PrepareOptions } from "./index";
import { usePretext } from "./composable";

const props = defineProps<{
  text: string;
  font: string;
  lineHeight: number;
  options?: PrepareOptions;
}>();

const containerRef = useTemplateRef<HTMLElement>("container");
const width = ref(0);

const { prepared } = usePretext(
  () => props.text,
  () => props.font,
  () => props.options,
);

const result = computed(() =>
  width.value > 0
    ? layoutWithLines(prepared.value, width.value, props.lineHeight)
    : { lines: [], height: 0, lineCount: 0 },
);

let observer: ResizeObserver | null = null;

onMounted(() => {
  const el = containerRef.value;
  if (!el) return;
  width.value = el.clientWidth;
  observer = new ResizeObserver((entries) => {
    width.value = entries[0].contentRect.width;
  });
  observer.observe(el);
});

onUnmounted(() => observer?.disconnect());

defineExpose({ prepared, result });
</script>

<template>
  <div ref="container">
    <slot
      :prepared="prepared"
      :lines="result.lines"
      :height="result.height"
      :line-count="result.lineCount"
      :width="width"
    />
  </div>
</template>
