<script setup lang="ts">
defineProps<{
  reactionCount: number
  repostCount: number
  replyCount: number
}>()
</script>

<template>
  <div class="flex items-center gap-3.5 text-xs text-gray-400 dark:text-gray-500">
    <span class="flex items-center gap-1 tabular-nums">
      <UIcon name="i-heroicons-heart" class="w-3.5 h-3.5" />
      {{ reactionCount }}
    </span>
    <span class="flex items-center gap-1 tabular-nums">
      <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-3.5 h-3.5" />
      {{ repostCount }}
    </span>
    <span class="flex items-center gap-1 tabular-nums">
      <UIcon name="i-heroicons-chat-bubble-oval-left" class="w-3.5 h-3.5" />
      {{ replyCount }}
    </span>
  </div>
</template>
