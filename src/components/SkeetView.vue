<template>
  <div class="skeetview">{{ skeet }}</div>
</template>

<script setup lang="ts">
const { skeet } = defineProps<{
  skeet: unknown
}>()
</script>

<style lang="scss"></style>
