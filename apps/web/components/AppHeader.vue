<script setup lang="ts">
import type { CrawlerStatusData } from '~/types'

const route = useRoute()
const router = useRouter()
const colorMode = useColorMode()
const adminStore = useAdminStore()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: () => {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  },
})

const { data: crawlerStatus } = useApi<CrawlerStatusData>('/nostr/status', {
  lazy: true,
  server: false,
})

const searchInput = ref((route.query.q as string) || '')

watch(() => route.query.q, (val) => {
  searchInput.value = (val as string) || ''
})

function onSearch() {
  const q = searchInput.value.trim()
  if (q.length < 2 && q.length > 0) return
  router.push({ query: { q: q || undefined } })
}

function clearSearch() {
  searchInput.value = ''
  router.push({ query: {} })
}
</script>

<template>
  <header class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/60 dark:border-gray-800/60 sticky top-0 z-50">
    <UContainer>
      <div class="flex items-center gap-4 h-14">
        <!-- Brand -->
        <NuxtLink to="/" class="flex items-center gap-2 flex-shrink-0 group">
          <UIcon name="i-heroicons-eye" class="w-5 h-5 text-primary-500 group-hover:text-primary-400 transition-colors" />
          <span class="text-sm font-bold text-gray-900 dark:text-white hidden sm:inline">Nostr Watch</span>
        </NuxtLink>

        <!-- Search bar -->
        <div class="flex-1 max-w-sm flex items-center gap-1.5">
          <UInput
            v-model="searchInput"
            placeholder="Search events..."
            icon="i-heroicons-magnifying-glass"
            size="sm"
            class="flex-1"
            :ui="{ rounded: 'rounded-lg' }"
            @keyup.enter="onSearch"
          />
          <UButton
            v-if="searchInput || route.query.q"
            icon="i-heroicons-x-mark"
            variant="ghost"
            color="gray"
            size="xs"
            @click="clearSearch"
          />
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-1 flex-shrink-0">
          <!-- Keywords admin link (only when authenticated) -->
          <UButton
            v-if="adminStore.authenticated"
            to="/keywords"
            icon="i-heroicons-tag"
            variant="ghost"
            color="gray"
            size="sm"
            class="hidden sm:flex"
          />

          <!-- Crawler status dot -->
          <UTooltip
            v-if="crawlerStatus"
            :text="crawlerStatus.isRunning ? 'Crawler running' : 'Crawler stopped'"
          >
            <div class="flex items-center px-2">
              <span
                class="w-2 h-2 rounded-full"
                :class="crawlerStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
              />
            </div>
          </UTooltip>

          <!-- Dark mode toggle -->
          <UButton
            :icon="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'"
            variant="ghost"
            color="gray"
            size="sm"
            @click="isDark = !isDark"
          />
        </div>
      </div>
    </UContainer>
  </header>
</template>
