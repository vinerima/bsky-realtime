import { ref, computed, type Ref, type ComputedRef } from "vue"
import { getPostsPage, getTotalCount } from "@/db/skeetDb"
import type { Post } from "@/types/post"

export function usePagination(pageSize: Ref<number>) {
  const currentPage: Ref<number> = ref(1)
  const totalCount: Ref<number> = ref(0)
  const displayedPosts: Ref<Post[]> = ref([])

  const totalPages: ComputedRef<number> = computed(() => {
    return Math.max(1, Math.ceil(totalCount.value / pageSize.value))
  })

  const hasNextPage: ComputedRef<boolean> = computed(() => {
    return currentPage.value < totalPages.value
  })

  const hasPrevPage: ComputedRef<boolean> = computed(() => {
    return currentPage.value > 1
  })

  async function refreshPage(): Promise<void> {
    totalCount.value = await getTotalCount()
    displayedPosts.value = await getPostsPage(currentPage.value, pageSize.value)
  }

  async function goToPage(page: number): Promise<void> {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value))
    await refreshPage()
  }

  async function nextPage(): Promise<void> {
    if (hasNextPage.value) {
      await goToPage(currentPage.value + 1)
    }
  }

  async function prevPage(): Promise<void> {
    if (hasPrevPage.value) {
      await goToPage(currentPage.value - 1)
    }
  }

  async function resetToFirst(): Promise<void> {
    currentPage.value = 1
    await refreshPage()
  }

  return {
    currentPage,
    totalCount,
    totalPages,
    displayedPosts,
    hasNextPage,
    hasPrevPage,
    refreshPage,
    goToPage,
    nextPage,
    prevPage,
    resetToFirst,
  }
}
