<script setup lang="ts">
defineProps<{ label: string; accept?: string }>();
const emit = defineEmits<{ select: [file: File] }>();

function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file !== undefined) emit("select", file);
}
</script>

<template>
  <label class="demo-field">
    <span>{{ label }}</span>
    <input type="file" :accept="accept" @change="onChange" />
  </label>
</template>

<style scoped src="./field.css"></style>
