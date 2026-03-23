<template>
  <main>
    <div id="search">
      <div class="inputGroup">
        <label for="keyword">Include Keyword(s)</label>
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
        <label for="user">Include User(s)</label>
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
        <label for="excludeKeyword">Exclude keyword(s)</label>
        <input
          type="text"
          id="excludeKeyword"
          name="excludeKeyword"
          pattern="^(?:[^,]+)(?:,\s*[^,]+)*$"
          placeholder="keyword(s) (comma-seperated)"
          v-model="excludeKeywordsString"
        />
      </div>
      <div class="inputGroup">
        <label for="excludeUser">Exclude User(s)</label>
        <input
          type="text"
          id="excludeUser"
          name="excludeUser"
          pattern="^(?:(?:[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*\.)+[A-Za-z]{2,})(?:,\s*(?:(?:[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*\.)+[A-Za-z]{2,}))*$"
          placeholder="handle(s) (comma-seperated)"
          v-model="excludeUsersString"
        />
      </div>
      <div class="inputGroup">
        <label for="language">Language(s)</label>
        <input
          type="text"
          id="language"
          name="language"
          pattern="^(?:[a-z]{2})(?:,\s*[a-z]{2})*$"
          placeholder="language code(s) (comma-seperated, e.g. en,de)"
          v-model="languagesString"
        />
      </div>
      <div class="inputGroup">
        <label for="pageSize">Posts per page</label>
        <input type="number" id="pageSize" name="pageSize" v-model="pageSize" />
      </div>
      <div class="inputGroup">
        <label for="manualUpdate">Manual update</label>
        <input type="checkbox" id="manualUpdate" name="manualUpdate" v-model="manualUpdate" />
      </div>
      <div class="buttonGroup">
        <button @click="onSubmit">{{ submitWord }}</button>
        <button @click="onStop" v-if="isConnected">Stop Stream</button>
        <button
          v-if="manualUpdate && pendingCount > 0"
          class="pending-banner"
          @click="showPendingPosts"
        >
          Show {{ pendingCount }} new post{{ pendingCount === 1 ? '' : 's' }}
        </button>
      </div>
    </div>
    <PaginationControls
      :current-page="currentPage"
      :total-pages="totalPages"
      :has-prev-page="hasPrevPage"
      :has-next-page="hasNextPage"
      @prev="prevPage"
      @next="nextPage"
    />
    <div id="view">
      <SkeetView v-for="skeet in displayedPosts" :key="skeet.id" :skeet />
    </div>
    <PaginationControls
      :current-page="currentPage"
      :total-pages="totalPages"
      :has-prev-page="hasPrevPage"
      :has-next-page="hasNextPage"
      @prev="prevPage"
      @next="nextPage"
    />
  </main>
</template>

<script setup lang="ts">
import { websocketMessageToPost } from '@/utils/feed'
import { websocketMessageSchema } from '@/types/message'
import { onBeforeUnmount, ref, computed, watch, type ComputedRef, type Ref } from 'vue'
import { WebSocketClient, LogLevel } from '@vinerima/wah'
import SkeetView from './SkeetView.vue'
import PaginationControls from './PaginationControls.vue'
import type { Post } from '@/types/post'
import { addPost, clearAllPosts } from '@/db/skeetDb'
import { usePagination } from '@/composables/usePagination'

const keywordsString: Ref<string | undefined> = ref()
const excludeKeywordsString: Ref<string | undefined> = ref()
const usersString: Ref<string | undefined> = ref()
const excludeUsersString: Ref<string | undefined> = ref()
const languagesString: Ref<string | undefined> = ref()
const pageSize: Ref<number> = ref(25)
const manualUpdate: Ref<boolean> = ref(false)
const pendingCount: Ref<number> = ref(0)

const {
  currentPage,
  totalCount,
  totalPages,
  displayedPosts,
  hasNextPage,
  hasPrevPage,
  refreshPage,
  nextPage,
  prevPage,
  resetToFirst,
} = usePagination(pageSize)

const keywords: Ref<string[] | undefined> = ref()
const excludeKeywords: Ref<string[] | undefined> = ref()
const languages: Ref<string[] | undefined> = ref()

const users: ComputedRef<string[] | undefined> = computed(() => {
  return usersString.value?.split(',')
})

const excludeUsers: ComputedRef<string[] | undefined> = computed(() => {
  return excludeUsersString.value?.split(',')
})

const userDids: Ref<{ did: string; handle: string }[]> = ref([])
const excludeUserDids: Ref<{ did: string; handle: string }[]> = ref([])

const submitWord = ref('Start Stream')
const isConnected = ref(false)

let client: WebSocketClient | null = null

const onSubmit = () => {
  keywords.value = keywordsString.value?.split(',')
  excludeKeywords.value = excludeKeywordsString.value?.split(',')
  languages.value = languagesString.value?.split(',').map((l) => l.trim())
  if (isConnected.value) {
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

const skeetMatchesLanguage = (skeet: Post) => {
  if (!languages.value) {
    return true
  }

  if (!skeet.langs) {
    return false
  }

  return skeet.langs.some((lang) => languages.value!.includes(lang))
}

const skeetContainsExcludedKeywords = (skeet: Post) => {
  if (!excludeKeywords.value) {
    return false
  }

  return excludeKeywords.value.some((keyword) => skeet.text.includes(keyword))
}

const skeetIsFromExcludedAuthor = (skeet: Post) => {
  if (!excludeUserDids.value.length) {
    return false
  }

  return excludeUserDids.value.some((userDid) => userDid.did === skeet.authorDid)
}

const showPendingPosts = async () => {
  pendingCount.value = 0
  await resetToFirst()
}

const onStop = () => {
  client?.close()
  client = null
  isConnected.value = false
  submitWord.value = 'Start Stream'
}

const connectWebSocket = async () => {
  await clearAllPosts()
  pendingCount.value = 0
  await refreshPage()

  client = new WebSocketClient({
    service: 'wss://api.graze.social/app/api/v1/turbostream/turbostream',
    queryParams: {
      wantedCollections: 'app.bsky.feed.post',
      requireHello: true,
    },
    logger: { enabled: true, level: LogLevel.INFO },
  })

  client.handle(websocketMessageSchema, ({ data }) => {
    const labels = data.hydrated_metadata.user.labels as { val?: string }[]
    if (labels.some((label) => label.val === '!no-unauthenticated')) {
      return
    }

    const skeet = websocketMessageToPost(data)
    if (
      skeet &&
      skeetContainsKeywords(skeet) &&
      skeetIsFromAuthor(skeet) &&
      skeetMatchesLanguage(skeet) &&
      !skeetContainsExcludedKeywords(skeet) &&
      !skeetIsFromExcludedAuthor(skeet)
    ) {
      void (async () => {
        await addPost(skeet)
        if (manualUpdate.value && totalCount.value >= pageSize.value) {
          pendingCount.value++
        } else if (currentPage.value === 1) {
          await refreshPage()
        }
      })()
    }
  })

  client.on('open', () => {
    isConnected.value = true
    updateWebSocket(true)
  })

  client.on('close', () => {
    isConnected.value = false
  })

  client.on('error', (err: unknown) => {
    console.error('WebSocket error:', err)
  })

  client.on('reconnecting', (info: unknown) => {
    console.log('Reconnecting:', info)
  })

  client.connect()
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
          throw new Error(`Failed to resolve ${trimUser}: ${response.status}`)
        }
        const data = await response.json()
        return { did: data.did, handle: trimUser }
      } catch (error) {
        console.error(`Error for ${trimUser}:`, error)
        return null
      }
    }),
  )

  return results
    .filter((result) => result.status === 'fulfilled' && result.value !== null)
    .map((result) => (result as PromiseFulfilledResult<{ did: string; handle: string }>).value)
}

const updateWebSocket = async (silent = false) => {
  if (!silent) {
    console.info('update user(s) and/or keyword(s)')
  }

  userDids.value = []
  excludeUserDids.value = []
  if (users.value && users.value[0].length > 1) {
    userDids.value = await getDids(users.value)
  }
  if (excludeUsers.value && excludeUsers.value[0].length > 1) {
    excludeUserDids.value = await getDids(excludeUsers.value)
  }
  client?.send({
    type: 'options_update',
    payload: {
      wantedCollections: ['app.bsky.feed.post'],
      wantedDids: userDids.value.map((userDid) => userDid.did),
    },
  })
}

watch(manualUpdate, async (isManual) => {
  if (!isManual && pendingCount.value > 0) {
    pendingCount.value = 0
    if (currentPage.value === 1) {
      await refreshPage()
    }
  }
})

watch(pageSize, async () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
  await refreshPage()
})

onBeforeUnmount(() => {
  client?.close()
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

.buttonGroup,
.inputGroup:has(input[type='checkbox']) {
  display: flex;
  gap: 1rem;
  padding-bottom: 0.5rem;
}

button {
  max-width: fit-content;
}

.pending-banner {
  width: 100%;
  padding: 0.5rem;
  text-align: center;
  cursor: pointer;
  font-weight: bold;
  color: var(--color-heading);
  border: 2px solid var(--color-heading);
  background-color: inherit;

  &:hover {
    background-color: var(--color-heading);
    color: var(--color-background);
  }
}

@media screen and (max-width: 371px) {
  .inputGroup {
    grid-template-rows: auto auto;
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
