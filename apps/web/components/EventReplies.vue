<script setup lang="ts">
import { timeAgo, truncatePubkey } from '~/utils/format'
import { parseEventContent } from '~/utils/content'

const props = defineProps<{
  eventId: string
}>()

interface Reply {
  id: string
  pubkey: string
  content: string
  createdAt: number
  author: {
    pubkey: string
    name: string | null
    displayName: string | null
    picture: string | null
    nip05: string | null
  } | null
}

const replies = ref<Reply[]>([])
const loading = ref(false)
const error = ref(false)

async function fetchReplies() {
  loading.value = true
  error.value = false
  try {
    const data = await $api<Reply[]>(`/nostr/replies/${props.eventId}`)
    replies.value = data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(() => props.eventId, () => {
  fetchReplies()
}, { immediate: true })

function replyAuthorName(reply: Reply): string {
  if (!reply.author) return truncatePubkey(reply.pubkey)
  return reply.author.displayName || reply.author.name || truncatePubkey(reply.author.pubkey)
}
</script>

<template>
  <div>
    <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <UIcon name="i-heroicons-chat-bubble-oval-left" class="w-4 h-4 text-gray-400" />
      Replies
      <span v-if="replies.length" class="text-xs text-gray-400 font-normal">({{ replies.length }})</span>
    </h4>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="flex items-start gap-2.5">
        <USkeleton class="w-7 h-7 rounded-full flex-shrink-0" />
        <div class="flex-1">
          <USkeleton class="h-3 w-24 mb-1.5" />
          <USkeleton class="h-3 w-full" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <p v-else-if="error" class="text-sm text-gray-400">
      Failed to load replies
    </p>

    <!-- Reply list -->
    <div v-else-if="replies.length" class="divide-y divide-gray-100 dark:divide-gray-800">
      <div
        v-for="reply in replies"
        :key="reply.id"
        class="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0"
      >
        <img
          v-if="reply.author?.picture"
          :src="reply.author.picture"
          class="w-7 h-7 rounded-full flex-shrink-0 object-cover ring-1 ring-gray-200 dark:ring-gray-700"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        >
        <div v-else class="w-7 h-7 rounded-full flex-shrink-0 bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700" />

        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2 mb-0.5">
            <span class="text-xs font-medium text-gray-900 dark:text-white truncate">
              {{ replyAuthorName(reply) }}
            </span>
            <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{{ timeAgo(reply.createdAt) }}</span>
          </div>
          <div
            class="event-content text-sm text-gray-600 dark:text-gray-400 leading-relaxed break-words"
            v-html="parseEventContent(reply.content).html"
          />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="text-center py-8">
      <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
      <p class="text-sm text-gray-400">No replies yet</p>
    </div>
  </div>
</template>
