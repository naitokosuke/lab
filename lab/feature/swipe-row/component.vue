<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { useSwipeRow } from "./composable";

/**
 * A row a finger slides left to show its actions behind it, as a phone's list does (iOS's
 * trailing swipe actions, Ionic's `ion-item-sliding`). Only a finger slides it: a mouse, a
 * keyboard and a screen reader get the row's actions some other way, which the row's owner
 * provides. `open` is kept by the owner, so one row is open at a time; `toggle` asks for it.
 * While open, a tap on the row, a touch anywhere else or a scroll closes it.
 */
const props = withDefaults(defineProps<{ open: boolean; duration?: number; easing?: string }>(), {
  duration: 280,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
});
const emit = defineEmits<{ toggle: [open: boolean] }>();

const root = useTemplateRef<HTMLElement>("root");
const set = useTemplateRef<HTMLElement>("set");
const content = useTemplateRef<HTMLElement>("content");

const { drag, offset, handlers } = useSwipeRow(root, set, content, {
  open: () => props.open,
  toggle: (open) => emit("toggle", open),
});

const style = computed(() => ({
  "--offset": `${offset.value}px`,
  "--swipe-duration": `${props.duration}ms`,
  "--swipe-easing": props.easing,
}));
</script>

<template>
  <div
    ref="root"
    class="swipe-row"
    :data-sliding="drag !== null || undefined"
    :style
    @pointerdown="handlers.down"
    @pointermove="handlers.move"
    @pointerup="handlers.up"
    @pointercancel="handlers.cancel"
  >
    <!-- behind the row, at its right end; out of reach until it is shown -->
    <div class="actions" :inert="offset === 0">
      <div ref="set" class="set">
        <slot name="actions"></slot>
      </div>
    </div>
    <div ref="content" class="content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.swipe-row {
  position: relative;
  /* the list still scrolls under a finger; sideways is the row's */
  touch-action: pan-y;
}

.content {
  translate: var(--offset) 0;
}

/* as wide as the row has gone: the actions are uncovered from the right, as if lying under it */
.actions {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  inline-size: calc(-1 * var(--offset));
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
}

/* the actions at their own width, or stretched when the row is pulled past it */
.set {
  flex-shrink: 0;
  display: flex;
  gap: var(--space-1);
  min-inline-size: 100%;
  inline-size: max-content;
  padding-inline-start: var(--space-2);
}

/* let go, it settles; under a finger it follows at once */
.swipe-row:not([data-sliding]) {
  > .content {
    transition: translate var(--swipe-duration) var(--swipe-easing);
  }

  > .actions {
    transition: inline-size var(--swipe-duration) var(--swipe-easing);
  }
}

/* under reduced motion it simply snaps to where it settles */
@media (prefers-reduced-motion: reduce) {
  .swipe-row:not([data-sliding]) > .content,
  .swipe-row:not([data-sliding]) > .actions {
    transition: none;
  }
}
</style>
