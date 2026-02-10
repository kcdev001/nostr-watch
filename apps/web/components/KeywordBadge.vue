<script setup lang="ts">
import type { Keyword } from '~/types'
import type { Ref } from 'vue'

const props = defineProps<{
  keyword: Keyword | string
}>()

const label = computed(() =>
  typeof props.keyword === 'string' ? props.keyword : props.keyword.keyword,
)

const activeGroupKeywords = inject<Ref<string[]>>('activeGroupKeywords', ref([]))

const isHighlighted = computed(() =>
  activeGroupKeywords.value.some((kw) => kw.toLowerCase() === label.value.toLowerCase()),
)
</script>

<template>
  <UBadge
    :variant="isHighlighted ? 'solid' : 'subtle'"
    :color="isHighlighted ? 'primary' : 'gray'"
    size="xs"
  >
    {{ label }}
  </UBadge>
</template>
