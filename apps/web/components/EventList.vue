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
      <UCard v-for="i in 5" :key="i">
        <div class="flex items-start gap-3 mb-3">
          <USkeleton class="w-8 h-8 rounded-full" />
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
      </UCard>
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
    <div v-else class="text-center py-12">
      <UIcon name="i-heroicons-chat-bubble-left-right" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p class="text-gray-500">No events found</p>
    </div>
  </div>
</template>
