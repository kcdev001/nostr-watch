<script setup lang="ts">
import type { NostrEvent } from '~/types'
import { timeAgo, truncatePubkey } from '~/utils/format'

const props = defineProps<{
  event: NostrEvent
  selected?: boolean
}>()

const emit = defineEmits<{
  select: [event: NostrEvent]
}>()

const authorName = computed(() => {
  const a = props.event.author
  if (!a) return truncatePubkey(props.event.pubkey)
  return a.displayName || a.name || truncatePubkey(a.pubkey)
})

const authorHandle = computed(() => {
  const a = props.event.author
  if (!a) return null
  if (a.name && a.name !== authorName.value) return `@${a.name}`
  if (a.nip05) return a.nip05
  return null
})
</script>

<template>
  <UCard
    :ui="{ body: { padding: 'px-4 py-4 sm:p-4' } }"
    :class="[
      'hover:ring-primary-500/30 hover:ring-2 transition-shadow cursor-pointer',
      selected ? 'ring-primary-500 ring-2' : '',
    ]"
    @click="emit('select', event)"
  >
    <div class="block">
      <!-- Author row -->
      <div class="flex items-start gap-3 mb-3">
        <AuthorAvatar :author="event.author" size="sm" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {{ authorName }}
            </span>
            <span v-if="authorHandle" class="text-xs text-gray-500 truncate">
              {{ authorHandle }}
            </span>
          </div>
          <span class="text-xs text-gray-400">{{ timeAgo(event.createdAt) }}</span>
        </div>
      </div>

      <!-- Content -->
      <div class="event-content text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-4" v-html="event.content" />

      <!-- Footer: Keywords + Engagement -->
      <div class="flex items-center justify-between gap-2">
        <div v-if="event.keywords?.length" class="flex flex-wrap gap-1">
          <KeywordBadge
            v-for="kw in event.keywords"
            :key="kw.id"
            :keyword="kw"
          />
        </div>
        <div v-else />
        <EngagementStats
          :reaction-count="event.reactionCount"
          :repost-count="event.repostCount"
          :reply-count="event.replyCount"
        />
      </div>
    </div>
  </UCard>
</template>
