<script setup lang="ts">
/**
 * 5 つのツリーパターンが共通で使う 1 行の見た目。データ構造には依存しない。
 * caret / indent / title / selected highlight だけを描く。
 * 子の展開は親側 (各ページの component.vue) が決める。
 */
defineProps<{
  title: string;
  depth: number;
  hasChildren: boolean;
  isOpened: boolean;
  isSelected: boolean;
  /** 同一エンティティが複数の親に紐づくとき (#6 DAG) のバッジ用 */
  appearances?: number;
}>();

const emit = defineEmits<{
  toggle: [];
  select: [];
}>();
</script>

<template>
  <div
    class="row"
    :data-opened="isOpened || undefined"
    :data-selected="isSelected || undefined"
    :data-leaf="!hasChildren || undefined"
    :style="{ '--depth': depth }"
  >
    <button
      class="caret"
      type="button"
      :aria-label="hasChildren ? (isOpened ? 'Collapse' : 'Expand') : 'Leaf'"
      :disabled="!hasChildren"
      @click="emit('toggle')"
    >
      <svg v-if="hasChildren" aria-hidden="true" class="caret-glyph" viewBox="0 0 10 10">
        <path d="M3 2 L7 5 L3 8 Z" fill="currentColor" />
      </svg>
      <span v-else aria-hidden="true" class="leaf-dot">·</span>
    </button>
    <button class="title" type="button" @click="emit('select')">
      <span class="title-text">{{ title }}</span>
      <span v-if="appearances !== undefined && appearances > 1" aria-label="linked appearance" class="badge">
        ⇄ ×{{ appearances }}
      </span>
    </button>
  </div>
</template>

<style scoped>
@property --depth {
  syntax: "<integer>";
  inherits: true;
  initial-value: 0;
}

.row {
  --tree-row-padding-block: 2px;
  --tree-row-hover-bg-mix: 60%;
  --tree-depth-guide-width: 2px;
  --tree-depth-guide-opacity: 0.5;
  --tree-depth-guide-transition-duration: 120ms;
  --tree-caret-size: 1.25em;
  --tree-caret-glyph-size: 0.7em;
  --tree-caret-opened-rotation: 90deg;
  --tree-caret-rotate-duration: 140ms;
  --tree-caret-rotate-easing: ease;
  --tree-row-focus-ring-offset: 1px;
  --tree-leaf-dot-opacity: 0.35;
  --tree-leaf-dot-font-size: 1.2em;
  --tree-title-padding-block: 2px;
  --tree-badge-bg-mix: 12%;
  --tree-badge-border-mix: 30%;

  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding-block: var(--tree-row-padding-block);
  padding-inline: calc(var(--space-2) + var(--depth) * var(--space-4)) var(--space-2);
  border-radius: var(--radius-s);
  cursor: default;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline-start: calc(
      var(--space-2) + var(--depth) * var(--space-4) - var(--tree-depth-guide-width)
    );
    inline-size: var(--tree-depth-guide-width);
    background: var(--border);
    opacity: calc(min(var(--depth), 1) * var(--tree-depth-guide-opacity));
    transition: opacity var(--tree-depth-guide-transition-duration);
  }

  &:hover {
    background: color-mix(in oklab, var(--accent-bg) var(--tree-row-hover-bg-mix), transparent);
  }
  &[data-selected] {
    background: var(--accent-bg);
  }
}

.caret {
  flex: none;
  inline-size: var(--tree-caret-size);
  block-size: var(--tree-caret-size);
  display: inline-grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  border-radius: var(--radius-s);
  transition: transform var(--tree-caret-rotate-duration) var(--tree-caret-rotate-easing);

  &:disabled {
    cursor: default;
    color: var(--border);
  }
  &:focus-visible {
    outline: var(--focus-ring-width) solid var(--accent);
    outline-offset: var(--tree-row-focus-ring-offset);
  }
}
.row[data-opened] .caret-glyph {
  transform: rotate(var(--tree-caret-opened-rotation));
  transition: transform var(--tree-caret-rotate-duration) var(--tree-caret-rotate-easing);
}
.caret-glyph {
  inline-size: var(--tree-caret-glyph-size);
  block-size: var(--tree-caret-glyph-size);
  transition: transform var(--tree-caret-rotate-duration) var(--tree-caret-rotate-easing);
}
.leaf-dot {
  opacity: var(--tree-leaf-dot-opacity);
  font-size: var(--tree-leaf-dot-font-size);
  line-height: 1;
}

.title {
  flex: 1 1 auto;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-inline-size: 0;
  border: 0;
  background: transparent;
  color: var(--text-h);
  font: inherit;
  font-family: var(--mono);
  font-size: var(--text-s);
  padding: var(--tree-title-padding-block) var(--space-2);
  border-radius: var(--radius-s);
  text-align: start;

  &:focus-visible {
    outline: var(--focus-ring-width) solid var(--accent);
    outline-offset: var(--tree-row-focus-ring-offset);
  }

  .row[data-selected] & {
    color: var(--accent);
    font-weight: var(--tree-emphasis-font-weight);
  }
}
.title-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.badge {
  flex: none;
  font-size: var(--text-xs);
  font-family: var(--mono);
  padding: 0 var(--space-1);
  border-radius: var(--radius-s);
  background: color-mix(in oklab, var(--accent) var(--tree-badge-bg-mix), transparent);
  color: var(--accent);
  border: var(--border-width) solid
    color-mix(in oklab, var(--accent) var(--tree-badge-border-mix), transparent);
}
</style>
