<script setup lang="ts">
import { formatNumber } from '~/utils/format'

const props = defineProps<{
  title: string
  value: number
  icon: string
}>()
</script>

<template>
  <UCard>
    <div class="flex items-center gap-4">
      <div class="rounded-lg bg-primary-50 dark:bg-primary-950/50 p-3">
        <UIcon :name="icon" class="w-6 h-6 text-primary-500" />
      </div>
      <div>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatNumber(value) }}</p>
        <p class="text-sm text-gray-500">{{ title }}</p>
      </div>
    </div>
  </UCard>
</template>
