<template>
  <div class="skeet-view">
    <a :href class="skeet-author-toggle" target="_blank">goto skeet</a>
    <p class="skeet-text">{{ skeet.text }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '@/types/post'
import { computed } from 'vue'

const { skeet } = defineProps<{
  skeet: Post
}>()

const href = computed(() => {
  return `https://bsky.app/profile/${skeet.authorDid}/post/${skeet.uri.split('/').pop()}`
})
</script>

<style lang="scss">
.skeet-view {
  padding-top: 1rem;
}
</style>
