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
const currentPage = computed(() => Number(route.query.page) || 1)
const currentGroup = computed(() => (route.query.group as string) || '')
const searchQuery = ref((route.query.q as string) || '')
const searchInput = ref(searchQuery.value)

// Selected event for detail panel
const selectedEvent = ref<NostrEvent | null>(null)

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

const apiParams = computed(() => {
  const params: Record<string, string | number> = {
    page: currentPage.value,
    limit: 20,
  }
  if (searchQuery.value) {
    params.q = searchQuery.value
  }
  return params
})

const { data, pending } = useApi<PaginatedResponse<NostrEvent>>(
  () => apiPath.value,
  {
    lazy: true,
    server: false,
    params: apiParams,
    watch: [apiPath, apiParams],
  },
)

// Clear selection when data changes (page/group/search)
watch([apiPath, currentPage], () => {
  selectedEvent.value = null
})

function onSearch() {
  const q = searchInput.value.trim()
  if (q.length < 2 && q.length > 0) return
  router.push({ query: { q: q || undefined } })
  searchQuery.value = q
}

function clearSearch() {
  searchInput.value = ''
  searchQuery.value = ''
  router.push({ query: { ...route.query, q: undefined, page: undefined } })
}

function selectGroup(group: string) {
  if (group === currentGroup.value) {
    router.push({ query: {} })
  } else {
    router.push({ query: { group } })
    searchInput.value = ''
    searchQuery.value = ''
  }
}

function goToPage(page: number) {
  router.push({ query: { ...route.query, page: page > 1 ? page : undefined } })
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
    <!-- Search bar -->
    <div class="flex gap-2 mb-4">
      <UInput
        v-model="searchInput"
        placeholder="Search events..."
        icon="i-heroicons-magnifying-glass"
        size="md"
        class="flex-1"
        @keyup.enter="onSearch"
      />
      <UButton label="Search" @click="onSearch" />
      <UButton
        v-if="searchQuery"
        icon="i-heroicons-x-mark"
        variant="ghost"
        color="gray"
        @click="clearSearch"
      />
    </div>

    <!-- Keyword group filter tabs -->
    <div class="flex flex-wrap gap-2 mb-6">
      <UButton
        size="xs"
        :variant="!currentGroup && !searchQuery ? 'solid' : 'ghost'"
        :color="!currentGroup && !searchQuery ? 'primary' : 'gray'"
        label="All"
        @click="selectGroup('')"
      />
      <UButton
        v-for="g in keywordsStore.groups"
        :key="g.name"
        size="xs"
        :variant="currentGroup === g.name ? 'solid' : 'ghost'"
        :color="currentGroup === g.name ? 'primary' : 'gray'"
        :label="g.name"
        @click="selectGroup(g.name)"
      />
    </div>

    <!-- Search result info -->
    <p v-if="searchQuery && data" class="text-sm text-gray-500 mb-4">
      {{ data.total }} results for "{{ searchQuery }}"
    </p>

    <!-- Split layout: list + detail -->
    <div class="flex gap-6">
      <!-- Left: Event list -->
      <div :class="selectedEvent ? 'w-1/2 hidden lg:block' : 'w-full max-w-3xl'">
        <EventList
          :events="data?.items || []"
          :loading="pending"
          :selected-id="selectedEvent?.id"
          @select="onSelectEvent"
        />

        <!-- Pagination -->
        <div v-if="data && data.pages > 1" class="flex justify-center mt-6">
          <UPagination
            :model-value="currentPage"
            :page-count="data.limit"
            :total="data.total"
            @update:model-value="goToPage"
          />
        </div>
      </div>

      <!-- Right: Detail panel (desktop) -->
      <div
        v-if="selectedEvent"
        class="flex-1 min-w-0 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
      >
        <!-- Mobile: back button -->
        <div class="lg:hidden mb-3">
          <UButton
            icon="i-heroicons-arrow-left"
            variant="ghost"
            color="gray"
            size="sm"
            label="Back to list"
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

        <UCard>
          <EventDetail :event="selectedEvent" />
        </UCard>
      </div>
    </div>
  </div>
</template>
