<script setup lang="ts">
import type { NostrEvent } from '~/types'
import { timeAgo, truncatePubkey } from '~/utils/format'
import { parseEventContent } from '~/utils/content'

const props = defineProps<{
  event: NostrEvent
}>()

const authorName = computed(() => {
  const a = props.event.author
  if (!a) return truncatePubkey(props.event.pubkey)
  return a.displayName || a.name || truncatePubkey(a.pubkey)
})

const fullDate = computed(() => {
  return new Date(props.event.createdAt * 1000).toLocaleString()
})

const parsed = computed(() => parseEventContent(props.event.content))

const copied = ref(false)
function copyEventId() {
  navigator.clipboard.writeText(props.event.id)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Author -->
    <div class="flex items-start gap-3">
      <AuthorAvatar :author="event.author" size="md" />
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-gray-900 dark:text-white">{{ authorName }}</h3>
        <p v-if="event.author?.nip05" class="text-sm text-primary-500">{{ event.author.nip05 }}</p>
        <p class="text-xs text-gray-400">{{ fullDate }}</p>
      </div>
    </div>

    <!-- Content -->
    <div
      class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words"
      v-html="parsed.html"
    />

    <!-- Images -->
    <div v-if="parsed.images.length" class="space-y-3">
      <img
        v-for="(img, i) in parsed.images"
        :key="i"
        :src="img"
        loading="lazy"
        class="rounded-lg max-w-full max-h-96 object-contain bg-gray-100 dark:bg-gray-800"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      >
    </div>

    <!-- Videos -->
    <div v-if="parsed.videos.length" class="space-y-3">
      <video
        v-for="(vid, i) in parsed.videos"
        :key="i"
        :src="vid"
        controls
        preload="metadata"
        class="rounded-lg max-w-full max-h-96 bg-black"
      />
    </div>

    <!-- Keywords -->
    <div v-if="event.keywords?.length" class="flex flex-wrap gap-1.5">
      <KeywordBadge
        v-for="kw in event.keywords"
        :key="kw.id"
        :keyword="kw"
      />
    </div>

    <!-- Engagement -->
    <EngagementStats
      :reaction-count="event.reactionCount"
      :repost-count="event.repostCount"
      :reply-count="event.replyCount"
    />

    <!-- Metadata -->
    <UDivider />
    <div class="flex items-center gap-2 text-xs text-gray-500">
      <code class="truncate flex-1">{{ event.id }}</code>
      <UButton
        :icon="copied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
        variant="ghost"
        color="gray"
        size="2xs"
        @click="copyEventId"
      />
    </div>

    <!-- Replies -->
    <UDivider />
    <EventReplies :event-id="event.id" />
  </div>
</template>
