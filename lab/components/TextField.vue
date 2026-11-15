<script setup lang="ts">
const model = defineModel<string>({ required: true });
defineProps<{ label: string }>();
</script>

<template>
  <label class="demo-field">
    <span>{{ label }}</span>
    <input v-model="model" type="text" />
  </label>
</template>

<style scoped src="./field.css"></style>
