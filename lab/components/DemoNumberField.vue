<script setup lang="ts">
const model = defineModel<number>({ required: true });
defineProps<{ label: string; min?: number; max?: number; step?: number }>();
</script>

<template>
  <label class="demo-field">
    <span>{{ label }}</span>
    <input v-model.number="model" type="number" :min="min" :max="max" :step="step" />
  </label>
</template>

<style scoped src="./field.css"></style>
