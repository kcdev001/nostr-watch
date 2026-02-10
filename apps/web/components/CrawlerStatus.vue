<script setup lang="ts">
import type { CrawlerStatusData } from '~/types'

const { data: status, pending, refresh } = useApi<CrawlerStatusData>('/nostr/status', {
  lazy: true,
  server: false,
})

const restarting = ref(false)

async function restart() {
  restarting.value = true
  try {
    await $api('/nostr/restart', { method: 'POST' })
    const toast = useToast()
    toast.add({ title: 'Crawler restarted', color: 'green', icon: 'i-heroicons-check-circle' })
    await refresh()
  } catch {
    const toast = useToast()
    toast.add({ title: 'Failed to restart crawler', color: 'red', icon: 'i-heroicons-x-circle' })
  } finally {
    restarting.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Crawler Status</h3>
        <UBadge
          v-if="status"
          :color="status.isRunning ? 'green' : 'red'"
          variant="subtle"
          size="xs"
        >
          {{ status.isRunning ? 'Running' : 'Stopped' }}
        </UBadge>
      </div>
    </template>

    <template v-if="pending">
      <div class="space-y-3">
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-3/4" />
      </div>
    </template>

    <template v-else-if="status">
      <div class="space-y-3 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">Subscriptions</span>
          <span class="text-gray-900 dark:text-white">{{ status.activeSubscriptions }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Write Queue</span>
          <span class="text-gray-900 dark:text-white">{{ status.writeQueueSize }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Seen Cache</span>
          <span class="text-gray-900 dark:text-white">{{ status.seenCacheSize.toLocaleString() }}</span>
        </div>
        <UDivider />
        <div>
          <p class="text-gray-500 mb-2">Connected Relays</p>
          <div class="space-y-1">
            <p v-for="relay in status.relays" :key="relay" class="text-xs text-gray-600 dark:text-gray-400 font-mono">
              {{ relay }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        label="Restart Crawler"
        icon="i-heroicons-arrow-path"
        size="sm"
        variant="soft"
        :loading="restarting"
        block
        @click="restart"
      />
    </template>
  </UCard>
</template>
