<template>
  <div class="skeet-view">
    <div class="skeet-author">
      <img class="skeet-author-avatar" :src="skeet.authorAvatar" />
      <a :href="authorLink" class="skeet-author-link" target="_blank">{{
        skeet.authorHandle ?? skeet.authorDid
      }}</a>
    </div>
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
  display: flex;
  flex-direction: row;
  column-gap: 1rem;
  padding-bottom: 0.5rem;
  height: 2.5rem;
}
.skeet-author-avatar {
  max-height: 2.5rem;
  aspect-ratio: 1;
  background-color: lightgray;
}
.skeet-author-link {
  margin: auto 0;
  font-weight: bold;
}
.skeet-view {
  padding-top: 2rem;
}
</style>
