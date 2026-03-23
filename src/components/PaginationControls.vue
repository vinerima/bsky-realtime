<template>
  <div class="pagination-controls" v-if="totalPages > 1">
    <button :disabled="!hasPrevPage" @click="$emit('prev')">Prev</button>
    <span class="pagination-info">Page {{ currentPage }} of {{ totalPages }}</span>
    <button :disabled="!hasNextPage" @click="$emit('next')">Next</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentPage: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
}>()

defineEmits<{
  prev: []
  next: []
}>()
</script>

<style lang="scss">
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.pagination-info {
  font-size: 0.875rem;
}
</style>
