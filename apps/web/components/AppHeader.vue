<script setup lang="ts">
import type { CrawlerStatusData } from '~/types'

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
</script>

<template>
  <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
    <UContainer>
      <div class="flex items-center justify-between h-16">
        <!-- Brand -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <UIcon name="i-heroicons-eye" class="w-7 h-7 text-primary-500" />
          <span class="text-lg font-bold text-gray-900 dark:text-white">Nostr Watch</span>
        </NuxtLink>

        <!-- Right side -->
        <div class="flex items-center gap-2">
          <!-- Keywords admin link (only when authenticated) -->
          <UButton
            v-if="adminStore.authenticated"
            to="/keywords"
            icon="i-heroicons-tag"
            label="Keywords"
            variant="ghost"
            color="gray"
            size="sm"
          />

          <!-- Crawler status dot -->
          <UTooltip
            v-if="crawlerStatus"
            :text="crawlerStatus.isRunning ? 'Crawler running' : 'Crawler stopped'"
          >
            <div class="flex items-center gap-1.5 text-xs text-gray-500">
              <span
                class="w-2 h-2 rounded-full"
                :class="crawlerStatus.isRunning ? 'bg-green-500' : 'bg-red-500'"
              />
              <span class="hidden lg:inline">{{ crawlerStatus.isRunning ? 'Running' : 'Stopped' }}</span>
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
