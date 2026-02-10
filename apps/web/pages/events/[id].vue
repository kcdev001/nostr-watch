<script setup lang="ts">
import type { NostrEvent } from '~/types'
import { timeAgo, truncatePubkey } from '~/utils/format'

const route = useRoute()

const { data: event, pending } = useApi<NostrEvent>(
  () => `/events/${route.params.id}`,
  {
    lazy: true,
    server: false,
  },
)

const authorName = computed(() => {
  if (!event.value?.author) return event.value ? truncatePubkey(event.value.pubkey) : ''
  const a = event.value.author
  return a.displayName || a.name || truncatePubkey(a.pubkey)
})

const fullDate = computed(() => {
  if (!event.value) return ''
  return new Date(event.value.createdAt * 1000).toLocaleString()
})

const copied = ref(false)
function copyEventId() {
  if (!event.value) return
  navigator.clipboard.writeText(event.value.id)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

useSeoMeta({
  title: () => event.value ? `Event by ${authorName.value} - Nostr Watch` : 'Event - Nostr Watch',
})
</script>

<template>
  <div>
    <!-- Back button -->
    <UButton
      to="/events"
      variant="ghost"
      color="gray"
      size="sm"
      icon="i-heroicons-arrow-left"
      label="Back to Events"
      class="mb-4"
    />

    <!-- Loading -->
    <UCard v-if="pending">
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <USkeleton class="w-12 h-12 rounded-full" />
          <div>
            <USkeleton class="h-5 w-32 mb-1" />
            <USkeleton class="h-4 w-24" />
          </div>
        </div>
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-3/4" />
      </div>
    </UCard>

    <!-- Not found -->
    <UAlert
      v-else-if="!event"
      icon="i-heroicons-exclamation-triangle"
      color="amber"
      variant="subtle"
      title="Event not found"
      description="This event may not have been crawled yet."
    />

    <!-- Event detail -->
    <UCard v-else>
      <!-- Author section -->
      <div class="flex items-start gap-4 mb-6">
        <AuthorAvatar :author="event.author" size="lg" />
        <div class="flex-1 min-w-0">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ authorName }}
          </h2>
          <p v-if="event.author?.name" class="text-sm text-gray-500">
            @{{ event.author.name }}
          </p>
          <p v-if="event.author?.nip05" class="text-sm text-primary-500">
            {{ event.author.nip05 }}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            {{ truncatePubkey(event.pubkey) }}
          </p>
        </div>
        <span class="text-sm text-gray-500 shrink-0">
          {{ timeAgo(event.createdAt) }}
        </span>
      </div>

      <!-- Content -->
      <div
        class="event-content text-gray-700 dark:text-gray-300 mb-6 text-base leading-relaxed"
        v-html="event.content"
      />

      <!-- Keywords -->
      <div v-if="event.keywords?.length" class="flex flex-wrap gap-2 mb-6">
        <KeywordBadge
          v-for="kw in event.keywords"
          :key="kw.id"
          :keyword="kw"
          clickable
        />
      </div>

      <!-- Engagement -->
      <div class="mb-6">
        <EngagementStats
          :reaction-count="event.reactionCount"
          :repost-count="event.repostCount"
          :reply-count="event.replyCount"
        />
      </div>

      <!-- Metadata -->
      <UDivider class="mb-4" />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <span class="text-gray-500">Event ID</span>
          <div class="flex items-center gap-2 mt-1">
            <code class="text-xs text-gray-600 dark:text-gray-400 truncate">{{ event.id }}</code>
            <UButton
              :icon="copied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
              variant="ghost"
              color="gray"
              size="2xs"
              @click="copyEventId"
            />
          </div>
        </div>
        <div>
          <span class="text-gray-500">Created</span>
          <p class="text-gray-700 dark:text-gray-300 mt-1">{{ fullDate }}</p>
        </div>
        <div v-if="event.relayUrl">
          <span class="text-gray-500">Relay</span>
          <p class="text-gray-700 dark:text-gray-300 mt-1">{{ event.relayUrl }}</p>
        </div>
        <div>
          <span class="text-gray-500">Engagement Score</span>
          <p class="text-gray-700 dark:text-gray-300 mt-1">{{ event.engagementScore }}</p>
        </div>
      </div>
    </UCard>
  </div>
</template>
