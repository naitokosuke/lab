<script setup lang="ts">
/** stats スロットで使う統計チップ。`label: value` 形式 */
defineProps<{
  label: string;
  value: string | number;
  emphasis?: boolean;
}>();
</script>

<template>
  <span class="chip" :data-emphasis="emphasis || undefined">
    <strong>{{ value }}</strong>
    <span>{{ label }}</span>
  </span>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-1);

  strong {
    color: var(--text-h);
    font-weight: 600;
  }
  span {
    color: var(--text);
    font-size: var(--text-xs);
  }

  &[data-emphasis] strong {
    color: var(--accent);
  }
}
</style>
