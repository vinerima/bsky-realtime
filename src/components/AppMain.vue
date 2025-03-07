<template>
  <main>
    <div id="search">
      <div class="inputGroup">
        <label for="keyword">Keyword(s)</label>
        <input type="text" id="keyword" name="keyword" v-model="keywordsString" />
      </div>
      <div class="inputGroup">
        <label for="user">User(s)</label>
        <input type="text" id="user" name="user" v-model="usersString" />
      </div>
      <div class="inputGroup">
        <label for="keepNumber">Show last skeets</label>
        <input type="number" id="keepNumber" name="keepNumber" v-model="keepNumber" />
      </div>
      <div class="inputGroup">
        <button @click="onSubmit">{{ submitWord }}</button>
        <button @click="onStop" v-if="jetstream">Stop Stream</button>
      </div>
    </div>
    <div id="view">
      <SkeetView v-for="(skeet, index) in showSkeets" :key="index" :skeet />
    </div>
  </main>
</template>

<script setup lang="ts">
import { websocketToFeedEntry } from '@/utils/feed'
import { computed, onBeforeMount, ref, type ComputedRef, type Ref } from 'vue'
import SkeetView from './SkeetView.vue'
import type { Post } from '@/types/post'

const keywordsString: Ref<string | undefined> = ref()
const usersString: Ref<string | undefined> = ref()
const keepNumber: Ref<number> = ref(25)
const skeets: Ref<Post[]> = ref([])
const showSkeets: ComputedRef<Post[]> = computed(() => {
  return skeets.value.slice(0, keep.value)
})

const keep: Ref<number> = ref(25)
const keywords: Ref<string[] | undefined> = ref()

const users: ComputedRef<string[] | undefined> = computed(() => {
  return usersString.value?.split(',')
})

const submitWord = ref('Start Stream')

const onSubmit = () => {
  keywords.value = keywordsString.value?.split(',')
  keep.value = keepNumber.value
  if (jetstreamRunning.value) {
    updateWebSocket()
  } else {
    submitWord.value = 'Update'
    connectWebSocket()
  }
}

const skeetContainsKeywords = (skeet: Post) => {
  if (!keywords.value) {
    return true
  }

  return keywords.value.some((keyword) => skeet.text.includes(keyword))
}

const onStop = () => {
  jetstream.value?.close()
  jetstream.value = null
  submitWord.value = 'Start Stream'
}

const jetstream: Ref<WebSocket | null> = ref(null)

const connectWebSocket = () => {
  jetstream.value = new WebSocket(
    'wss://jetstream1.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post',
  )

  jetstream.value.onopen = () => {
    console.log('WebSocket connected')
  }

  jetstream.value.onmessage = (event) => {
    const skeet = websocketToFeedEntry(event.data)
    if (skeet && skeetContainsKeywords(skeet)) {
      skeets.value.unshift(skeet)
    }
  }

  jetstream.value.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  jetstream.value.onclose = () => {
    console.log('WebSocket disconnected')
  }
}

const getDids = async (users: string[]): Promise<string[]> => {
  const results = await Promise.allSettled(
    users.map(async (user) => {
      try {
        const response = await fetch(
          `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${user}`,
        )
        if (!response.ok) {
          throw new Error(`Fehler beim Abrufen von ${user}: ${response.status}`)
        }
        const data = await response.json()
        return data.did
      } catch (error) {
        console.error(`Fehler für ${user}:`, error)
        return null // Fehlerhafte Anfragen geben `null` zurück
      }
    }),
  )

  // Nur erfolgreiche `did`-Werte zurückgeben
  return results
    .filter((result) => result.status === 'fulfilled' && result.value !== null)
    .map((result) => (result as PromiseFulfilledResult<string>).value)
}

const updateWebSocket = async () => {
  console.info('update user(s) and/or keyword(s)')

  let dids: string[] = []
  if (users.value && users.value[0].length > 1) {
    console.log(users.value)
    dids = await getDids(users.value)
  }
  jetstream.value?.send(
    JSON.stringify({
      type: 'options_update',
      payload: {
        wantedCollections: ['app.bsky.feed.post'],
        wantedDids: dids,
      },
    }),
  )
}

const jetstreamRunning = computed(
  () => jetstream.value && jetstream.value.readyState === WebSocket.OPEN,
)

onBeforeMount(() => {
  jetstream.value?.close()
})
</script>

<style lang="scss">
main {
  height: 100%;
}
#search {
  position: sticky;
  top: 0;
  background: var(--color-background);
  padding-bottom: 1rem;
}
</style>
