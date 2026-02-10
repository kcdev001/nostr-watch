<script setup lang="ts">
defineProps<{
  reactionCount: number
  repostCount: number
  replyCount: number
}>()
</script>

<template>
  <div class="flex items-center gap-4 text-sm text-gray-500">
    <span class="flex items-center gap-1">
      <UIcon name="i-heroicons-heart" class="w-4 h-4" />
      {{ reactionCount }}
    </span>
    <span class="flex items-center gap-1">
      <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-4 h-4" />
      {{ repostCount }}
    </span>
    <span class="flex items-center gap-1">
      <UIcon name="i-heroicons-chat-bubble-oval-left" class="w-4 h-4" />
      {{ replyCount }}
    </span>
  </div>
</template>
