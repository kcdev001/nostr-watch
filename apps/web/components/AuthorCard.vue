<script setup lang="ts">
import type { TopAuthor } from '~/types'
import { truncatePubkey, formatNumber } from '~/utils/format'

const props = defineProps<{
  author: TopAuthor
  rank?: number
}>()

const displayName = computed(() => {
  const p = props.author.profile
  if (!p) return truncatePubkey(props.author.pubkey)
  return p.displayName || p.name || truncatePubkey(p.pubkey)
})
</script>

<template>
  <UCard :ui="{ body: { padding: 'px-4 py-3 sm:p-4' } }">
    <div class="flex items-center gap-3">
      <span v-if="rank" class="text-lg font-bold text-gray-400 w-6 text-center">{{ rank }}</span>
      <AuthorAvatar :author="author.profile" size="md" />
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-gray-900 dark:text-white truncate text-sm">
          {{ displayName }}
        </p>
        <p v-if="author.profile?.nip05" class="text-xs text-primary-500 truncate">
          {{ author.profile.nip05 }}
        </p>
      </div>
      <div class="text-right shrink-0">
        <p class="text-sm font-medium text-gray-900 dark:text-white">
          {{ formatNumber(author.eventCount) }}
        </p>
        <p class="text-xs text-gray-500">events</p>
      </div>
      <div class="text-right shrink-0">
        <p class="text-sm font-medium text-gray-900 dark:text-white">
          {{ formatNumber(author.totalReactions) }}
        </p>
        <p class="text-xs text-gray-500">reactions</p>
      </div>
    </div>
  </UCard>
</template>
