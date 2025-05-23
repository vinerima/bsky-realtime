<template>
  <main>
    <div id="search">
      <div class="inputGroup">
        <label for="keyword">Keyword(s)</label>
        <input
          type="text"
          id="keyword"
          name="keyword"
          pattern="^(?:[^,]+)(?:,\s*[^,]+)*$"
          placeholder="keyword(s) (comma-seperated)"
          v-model="keywordsString"
        />
      </div>
      <div class="inputGroup">
        <label for="user">User(s)</label>
        <input
          type="text"
          id="user"
          name="user"
          pattern="^(?:(?:[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*\.)+[A-Za-z]{2,})(?:,\s*(?:(?:[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*\.)+[A-Za-z]{2,}))*$"
          placeholder="handle(s) (comma-seperated)"
          v-model="usersString"
        />
      </div>
      <div class="inputGroup">
        <label for="keepNumber">Show last skeets</label>
        <input type="number" id="keepNumber" name="keepNumber" v-model="keepNumber" />
      </div>
      <div class="buttonGroup">
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

const userDids: Ref<{ did: string; handle: string }[]> = ref([])

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

const skeetIsFromAuthor = (skeet: Post) => {
  if (!users.value) {
    return true
  }

  return userDids.value.find((userDid) => {
    return userDid.did === skeet.authorDid
  })
}

const onStop = () => {
  jetstream.value?.close()
  jetstream.value = null
  submitWord.value = 'Start Stream'
}

const jetstream: Ref<WebSocket | null> = ref(null)

const connectWebSocket = () => {
  jetstream.value = new WebSocket(
    'wss://api.graze.social/app/api/v1/turbostream/turbostream?wantedCollections=app.bsky.feed.post&requireHello=true',
  )

  jetstream.value.onopen = () => {
    console.log('WebSocket connected')
    updateWebSocket(true)
  }

  jetstream.value.onmessage = (event) => {
    const skeet = websocketToFeedEntry(event.data)
    if (skeet && skeetContainsKeywords(skeet) && skeetIsFromAuthor(skeet)) {
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

const getDids = async (users: string[]): Promise<{ did: string; handle: string }[]> => {
  const results = await Promise.allSettled(
    users.map(async (user) => {
      const trimUser = user.trim()
      try {
        const response = await fetch(
          `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${trimUser}`,
        )
        if (!response.ok) {
          throw new Error(`Fehler beim Abrufen von ${trimUser}: ${response.status}`)
        }
        const data = await response.json()
        return { did: data.did, handle: trimUser }
      } catch (error) {
        console.error(`Fehler für ${trimUser}:`, error)
        return null // Fehlerhafte Anfragen geben `null` zurück
      }
    }),
  )

  // Nur erfolgreiche `did`-Werte zurückgeben
  return results
    .filter((result) => result.status === 'fulfilled' && result.value !== null)
    .map((result) => (result as PromiseFulfilledResult<{ did: string; handle: string }>).value)
}

const updateWebSocket = async (silent = false) => {
  if (!silent) {
    console.info('update user(s) and/or keyword(s)')
  }

  userDids.value = []
  if (users.value && users.value[0].length > 1) {
    userDids.value = await getDids(users.value)
  }
  jetstream.value?.send(
    JSON.stringify({
      type: 'options_update',
      payload: {
        wantedCollections: ['app.bsky.feed.post'],
        wantedDids: userDids.value.map((userDid) => userDid.did),
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

.inputGroup {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  padding-bottom: 0.5rem;
  max-width: 600px;
}

.buttonGroup {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0;
}

@media screen and (max-width: 371px) {
  .inputGroup {
    grid-template-rows: auto auto;
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
