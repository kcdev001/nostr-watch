<script setup lang="ts">
import type { NostrEvent, PaginatedResponse } from '~/types'

const route = useRoute()
const router = useRouter()
const keywordsStore = useKeywordsStore()

onMounted(() => {
  if (!keywordsStore.groups.length) {
    keywordsStore.fetchGroups()
  }
})

// URL-driven state
const currentGroup = computed(() => (route.query.group as string) || '')
const searchQuery = computed(() => (route.query.q as string) || '')

// Selected event for detail panel
const selectedEvent = ref<NostrEvent | null>(null)

// Infinite scroll state
const events = ref<NostrEvent[]>([])
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = computed(() => page.value < totalPages.value)

// Determine which API endpoint to call
const apiPath = computed(() => {
  if (searchQuery.value) {
    return `/events/search`
  }
  if (currentGroup.value) {
    return `/events/group/${encodeURIComponent(currentGroup.value)}`
  }
  return '/events'
})

async function loadEvents(p: number, append = false) {
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
  }

  try {
    const params: Record<string, string | number> = { page: p, limit: 20 }
    if (searchQuery.value) {
      params.q = searchQuery.value
    }

    const data = await $api<PaginatedResponse<NostrEvent>>(apiPath.value, { params })

    if (append) {
      events.value.push(...data.items)
    } else {
      events.value = data.items
    }
    page.value = data.page
    totalPages.value = data.pages
  } catch {
    // Silently fail
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Reload when any filter changes
watch([apiPath, searchQuery], () => {
  page.value = 1
  selectedEvent.value = null
  loadEvents(1)
}, { immediate: true })

function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadEvents(page.value + 1, true)
}

// Infinite scroll: detect when user scrolls near bottom
const listRef = ref<HTMLElement | null>(null)

function onScroll() {
  const el = listRef.value
  if (!el || loadingMore.value || !hasMore.value) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
    loadMore()
  }
}

function selectGroup(group: string) {
  if (group === currentGroup.value) {
    router.push({ query: {} })
  } else {
    router.push({ query: { group } })
  }
}

function onSelectEvent(event: NostrEvent) {
  selectedEvent.value = event
}

function closeDetail() {
  selectedEvent.value = null
}

// Provide active group keywords to child components for highlighting
const activeGroupKeywords = computed(() => {
  if (!currentGroup.value) return [] as string[]
  const group = keywordsStore.groups.find((g) => g.name === currentGroup.value)
  return group?.keywords || []
})
provide('activeGroupKeywords', activeGroupKeywords)
</script>

<template>
  <div>
    <!-- Keyword group filter tabs -->
    <div class="flex items-center gap-1.5 mb-5 pb-3 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
      <UButton
        size="xs"
        :variant="!currentGroup && !searchQuery ? 'soft' : 'ghost'"
        :color="!currentGroup && !searchQuery ? 'primary' : 'gray'"
        label="All"
        class="flex-shrink-0"
        @click="selectGroup('')"
      />
      <UButton
        v-for="g in keywordsStore.groups"
        :key="g.name"
        size="xs"
        :variant="currentGroup === g.name ? 'soft' : 'ghost'"
        :color="currentGroup === g.name ? 'primary' : 'gray'"
        :label="g.name"
        class="flex-shrink-0"
        @click="selectGroup(g.name)"
      />
    </div>

    <!-- Search result info -->
    <p v-if="searchQuery && events.length" class="text-sm text-gray-500 dark:text-gray-400 mb-4">
      Results for "<span class="text-gray-900 dark:text-white font-medium">{{ searchQuery }}</span>"
    </p>

    <!-- Split layout: list + detail -->
    <div class="flex gap-6">
      <!-- Left: Event list with infinite scroll -->
      <div
        ref="listRef"
        :class="selectedEvent ? 'hidden lg:block' : ''"
        class="w-full lg:w-1/2 lg:flex-shrink-0 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto scrollbar-thin"
        @scroll="onScroll"
      >
        <EventList
          :events="events"
          :loading="loading"
          :selected-id="selectedEvent?.id"
          @select="onSelectEvent"
        />

        <!-- Load more indicator -->
        <div v-if="loadingMore" class="flex justify-center py-4">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-gray-400 animate-spin" />
        </div>
        <p v-else-if="!hasMore && events.length > 0" class="text-center py-4 text-xs text-gray-400">
          No more events
        </p>
      </div>

      <!-- Right: Detail panel (desktop) -->
      <div
        v-if="selectedEvent"
        class="flex-1 min-w-0 lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto scrollbar-thin"
      >
        <!-- Mobile: back button -->
        <div class="lg:hidden mb-3">
          <UButton
            icon="i-heroicons-arrow-left"
            variant="ghost"
            color="gray"
            size="sm"
            label="Back"
            @click="closeDetail"
          />
        </div>

        <!-- Desktop: close button -->
        <div class="hidden lg:flex justify-end mb-2">
          <UButton
            icon="i-heroicons-x-mark"
            variant="ghost"
            color="gray"
            size="xs"
            @click="closeDetail"
          />
        </div>

        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <EventReplies :event-id="selectedEvent.id" />
        </div>
      </div>
    </div>
  </div>
</template>
