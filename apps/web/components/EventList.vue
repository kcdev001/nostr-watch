<script setup lang="ts">
import type { NostrEvent } from '~/types'

defineProps<{
  events: NostrEvent[]
  loading?: boolean
  selectedId?: string
}>()

const emit = defineEmits<{
  select: [event: NostrEvent]
}>()
</script>

<template>
  <div class="space-y-3">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div
        v-for="i in 5"
        :key="i"
        class="rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
      >
        <div class="flex items-center gap-2.5 mb-3">
          <USkeleton class="w-8 h-8 rounded-full flex-shrink-0" />
          <div class="flex-1">
            <USkeleton class="h-4 w-32 mb-1" />
            <USkeleton class="h-3 w-20" />
          </div>
        </div>
        <USkeleton class="h-4 w-full mb-2" />
        <USkeleton class="h-4 w-3/4 mb-3" />
        <div class="flex justify-between">
          <USkeleton class="h-5 w-16" />
          <USkeleton class="h-4 w-24" />
        </div>
      </div>
    </template>

    <!-- Event cards -->
    <template v-else-if="events.length">
      <EventCard
        v-for="event in events"
        :key="event.id"
        :event="event"
        :selected="event.id === selectedId"
        @select="emit('select', $event)"
      />
    </template>

    <!-- Empty state -->
    <div v-else class="text-center py-16">
      <UIcon name="i-heroicons-chat-bubble-left-right" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p class="text-sm text-gray-400">No events found</p>
    </div>
  </div>
</template>
