<script setup lang="ts">
/** A labelled range slider; `value` is what to show beside it (the raw number when omitted) */
defineProps<{ label: string; min: number; max: number; step?: number; value?: string }>();
const model = defineModel<number>({ required: true });
</script>

<template>
  <label class="field">
    <span>{{ label }}</span>
    <input v-model.number="model" type="range" :min :max :step />
    <output>{{ value ?? model }}</output>
  </label>
</template>

<style scoped src="./field.css"></style>
