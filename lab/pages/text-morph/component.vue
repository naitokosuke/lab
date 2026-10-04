<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import type { MorphPart } from "./core/glyphs";
import { useTextMorph } from "./composable";

/**
 * Text that morphs instead of being replaced: "1日目 11/3" to "2日目 11/4" moves only the
 * digits. A part's `tone` is a class on its characters, for the parent to style with
 * `:deep(.tone)`.
 */
const props = withDefaults(
  defineProps<{ parts: readonly MorphPart[]; duration?: number; easing?: string }>(),
  { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
);

const root = useTemplateRef<HTMLElement>("root");
const exits = useTemplateRef<HTMLElement>("exits");
const text = computed(() => props.parts.map((p) => p.text).join(""));

const { glyphs, stats } = useTextMorph(root, exits, () => props.parts, {
  duration: () => props.duration,
  easing: () => props.easing,
});

defineExpose({ stats });
</script>

<template>
  <span ref="root" class="text-morph">
    <!-- the whole text, once, for screen readers; the characters are hidden from them -->
    <span class="sr">{{ text }}</span>
    <span v-for="g in glyphs" :key="g.id" aria-hidden="true" :class="g.tone" :data-g="g.id">{{
      g.ch
    }}</span>
    <!-- the leaving characters' copies, over the row and out of its flow -->
    <span ref="exits" aria-hidden="true" class="exits"></span>
  </span>
</template>

<style scoped>
/* the row, and each character in it: a character moves as a box */
.text-morph,
.text-morph > [data-g] {
  position: relative;
  display: inline-block;
  white-space: pre;
}

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.exits {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
