<script setup lang="ts">
defineProps<{ label: string; min?: number; max?: number; step?: number }>();
const model = defineModel<number>({ required: true });
</script>

<template>
  <label class="field">
    <span>{{ label }}</span>
    <input v-model.number="model" type="number" :min :max :step />
  </label>
</template>

<style scoped src="./field.css"></style>
