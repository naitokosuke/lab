<script setup lang="ts">
/** A labelled range slider; `value` is what to show beside it (the raw number when omitted) */
const model = defineModel<number>({ required: true });
defineProps<{ label: string; min: number; max: number; step?: number; value?: string }>();
</script>

<template>
  <label class="demo-field">
    <span>{{ label }}</span>
    <input v-model.number="model" type="range" :min="min" :max="max" :step="step" />
    <output>{{ value ?? model }}</output>
  </label>
</template>

<style scoped src="./field.css"></style>
