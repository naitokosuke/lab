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
      type="button"
      class="caret"
      :aria-label="hasChildren ? (isOpened ? 'Collapse' : 'Expand') : 'Leaf'"
      :disabled="!hasChildren"
      @click="emit('toggle')"
    >
      <svg v-if="hasChildren" class="caret-glyph" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M3 2 L7 5 L3 8 Z" fill="currentColor" />
      </svg>
      <span v-else class="leaf-dot" aria-hidden="true">·</span>
    </button>
    <button type="button" class="title" @click="emit('select')">
      <span class="title-text">{{ title }}</span>
      <span v-if="appearances && appearances > 1" class="badge" aria-label="linked appearance">
        ⇄ ×{{ appearances }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding-block: 2px;
  padding-inline: calc(var(--space-2) + var(--depth, 0) * var(--space-4)) var(--space-2);
  border-radius: var(--radius-s);
  cursor: default;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline-start: calc(var(--space-2) + var(--depth, 0) * var(--space-4) - 2px);
    inline-size: 2px;
    background: var(--border);
    opacity: 0;
    transition: opacity 120ms;
  }
  &[data-depth]::before,
  &:where(:not([style*="--depth: 0"]))::before {
    opacity: 0.5;
  }

  &:hover {
    background: color-mix(in oklab, var(--accent-bg) 60%, transparent);
  }
  &[data-selected] {
    background: var(--accent-bg);
  }
}

.caret {
  flex: none;
  inline-size: 1.25em;
  block-size: 1.25em;
  display: inline-grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  cursor: pointer;
  border-radius: var(--radius-s);
  transition: transform 140ms ease;

  &:disabled {
    cursor: default;
    color: var(--border);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
}
.row[data-opened] .caret-glyph {
  transform: rotate(90deg);
  transition: transform 140ms ease;
}
.caret-glyph {
  inline-size: 0.7em;
  block-size: 0.7em;
  transition: transform 140ms ease;
}
.leaf-dot {
  opacity: 0.35;
  font-size: 1.2em;
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
  cursor: pointer;
  padding: 2px var(--space-2);
  border-radius: var(--radius-s);
  text-align: start;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  .row[data-selected] & {
    color: var(--accent);
    font-weight: 600;
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
  background: color-mix(in oklab, var(--accent) 12%, transparent);
  color: var(--accent);
  border: 1px solid color-mix(in oklab, var(--accent) 30%, transparent);
}
</style>
