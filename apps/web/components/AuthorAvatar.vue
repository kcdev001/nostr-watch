<script setup lang="ts">
import type { NostrProfile } from '~/types'
import { truncatePubkey } from '~/utils/format'

const props = defineProps<{
  author: NostrProfile | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
}>()

const displayName = computed(() => {
  if (!props.author) return 'Unknown'
  return props.author.displayName || props.author.name || truncatePubkey(props.author.pubkey)
})
</script>

<template>
  <UTooltip :text="displayName">
    <UAvatar
      :src="author?.picture || undefined"
      :alt="displayName"
      :size="size || 'sm'"
    />
  </UTooltip>
</template>
