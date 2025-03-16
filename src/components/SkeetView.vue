<template>
  <div class="skeet-view">
    <p class="skeet-author" v-if="skeet.authorHandle">{{ skeet.authorHandle }}</p>
    <a :href="authorLink" class="skeet-author" target="_blank" v-else>{{ skeet.authorDid }}</a>
    <p class="skeet-date" v-if="skeet.createdAt">{{ skeet.createdAt }}</p>
    <p class="skeet-text">{{ skeet.text }}</p>
    <a :href="skeetLink" class="skeet-link" target="_blank">goto skeet</a>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '@/types/post'
import { computed } from 'vue'

const { skeet } = defineProps<{
  skeet: Post
}>()

const authorLink = computed(() => {
  return `https://bsky.app/profile/${skeet.authorDid}`
})
const skeetLink = computed(() => {
  return `${authorLink.value}/post/${skeet.uri.split('/').pop()}`
})
</script>

<style lang="scss">
.skeet-author {
  font-weight: bold;
  color: white;
}
.skeet-view {
  padding-top: 1rem;
}
</style>
