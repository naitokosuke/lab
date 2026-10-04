<script setup lang="ts">
/**
 * One icon in the dock. The icon says what it is; its name shows above it under a hovering
 * pointer and is the accessible name everywhere. `current` marks it as the one open, which
 * the dock shows with a dot sliding under it. With `href` it is a link (a place of its own,
 * which a modified click opens elsewhere), otherwise a button.
 */
defineProps<{ label: string; current?: boolean; href?: string }>();
const emit = defineEmits<{ click: [event: MouseEvent] }>();
defineSlots<{ default(): unknown }>();
const onClick = (e: MouseEvent) => emit("click", e);
</script>

<template>
  <a
    v-if="href !== undefined"
    data-dock-item
    :href
    :aria-label="label"
    :aria-current="current ? 'page' : undefined"
    @click="onClick"
  >
    <span class="icon"><slot></slot></span>
    <span aria-hidden="true" class="tip">{{ label }}</span>
  </a>
  <button
    v-else
    data-dock-item
    type="button"
    :aria-label="label"
    :aria-current="current ? 'page' : undefined"
    @click="onClick"
  >
    <span class="icon"><slot></slot></span>
    <span aria-hidden="true" class="tip">{{ label }}</span>
  </button>
</template>

<style scoped>
a,
button {
  position: relative;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: calc(var(--cell) * var(--m, 1));
  height: var(--cell);
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--dock-muted);
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  /* following the pointer closely; letting go, springing back (the dock picks which) */
  transition:
    width var(--dock-grow-duration) var(--dock-grow-ease),
    color var(--dock-duration-swap) ease;

  &[aria-current="page"] {
    color: var(--dock-ink);
  }

  @media (hover: hover) {
    &:hover {
      color: var(--dock-ink);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--dock-ink);
    outline-offset: 2px;
  }

  /* the icon grows from its foot, up out of the glass */
  > .icon {
    display: grid;
    place-items: center;
    width: var(--cell);
    height: var(--cell);
    border-radius: 12px;
    scale: var(--m, 1);
    transform-origin: 50% 100%;
    transition:
      scale var(--dock-grow-duration) var(--dock-grow-ease),
      background-color var(--dock-duration-swap) ease;
  }

  &:active > .icon {
    background: var(--dock-wash);
  }

  /* its name, above it, once a pointer rests on it (or the keyboard is on it) */
  > .tip {
    position: absolute;
    inset-inline-start: 50%;
    inset-block-end: calc(var(--cell) * var(--m, 1) + 10px);
    translate: -50% 4px;
    padding: 4px 10px;
    border-radius: 8px;
    background: var(--dock-ink);
    color: var(--dock-on-ink);
    font-size: var(--text-xs);
    font-weight: 700;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition:
      opacity var(--dock-duration-tip) ease,
      translate var(--dock-duration-tip) ease;
  }

  @media (hover: hover) {
    &:hover > .tip {
      opacity: 1;
      translate: -50% 0;
    }
  }

  &:focus-visible > .tip {
    opacity: 1;
    translate: -50% 0;
  }
}
</style>
