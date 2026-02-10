<script setup lang="ts">
import type { NostrEvent } from '~/types'
import { timeAgo, truncatePubkey } from '~/utils/format'
import { parseEventContent } from '~/utils/content'

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

const parsed = computed(() => parseEventContent(props.event.content))

const authorHandle = computed(() => {
  const a = props.event.author
  if (!a) return null
  if (a.name && a.name !== authorName.value) return `@${a.name}`
  if (a.nip05) return a.nip05
  return null
})
</script>

<template>
  <div
    :class="[
      'rounded-xl transition-all duration-150 cursor-pointer border-2 bg-white dark:bg-gray-900',
      selected
        ? 'border-primary-500 dark:border-primary-400'
        : 'border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md',
    ]"
    @click="emit('select', event)"
  >
    <div class="px-4 py-3">
      <!-- Author row -->
      <div class="flex items-center gap-2.5 mb-2">
        <AuthorAvatar :author="event.author" size="sm" />
        <div class="flex-1 min-w-0 flex items-baseline gap-2">
          <span class="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {{ authorName }}
          </span>
          <span v-if="authorHandle" class="text-xs text-gray-400 dark:text-gray-500 truncate">
            {{ authorHandle }}
          </span>
          <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-auto">
            {{ timeAgo(event.createdAt) }}
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="event-content text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2 break-words" v-html="parsed.html" />

      <!-- Images -->
      <div v-if="parsed.images.length" class="mb-2">
        <img
          v-for="(img, i) in parsed.images"
          :key="i"
          :src="img"
          loading="lazy"
          class="rounded-lg max-w-full max-h-72 object-contain bg-gray-100 dark:bg-gray-800"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        >
      </div>

      <!-- Videos -->
      <div v-if="parsed.videos.length" class="mb-2">
        <video
          v-for="(vid, i) in parsed.videos"
          :key="i"
          :src="vid"
          controls
          preload="metadata"
          class="rounded-lg max-w-full max-h-72 bg-black"
        />
      </div>

      <!-- Footer: Keywords + Engagement -->
      <div class="flex items-center justify-between gap-2 pt-1">
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
  </div>
</template>
