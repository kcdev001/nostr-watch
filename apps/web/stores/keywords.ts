import { defineStore } from 'pinia'
import type { Keyword, KeywordGroup } from '~/types'

export const useKeywordsStore = defineStore('keywords', {
  state: () => ({
    keywords: [] as Keyword[],
    groups: [] as KeywordGroup[],
    loading: false,
  }),

  getters: {
    activeKeywords: (state) => state.keywords.filter((k) => k.isActive),
  },

  actions: {
    async fetch() {
      this.loading = true
      try {
        this.keywords = await $api<Keyword[]>('/keywords')
      } finally {
        this.loading = false
      }
    },

    async fetchGroups() {
      this.groups = await $api<KeywordGroup[]>('/keywords/groups')
    },

    async create(keyword: string, groupName?: string) {
      const created = await $api<Keyword>('/keywords', {
        method: 'POST',
        body: { keyword, groupName },
      })
      this.keywords.unshift(created)
      return created
    },

    async toggle(id: number) {
      const updated = await $api<Keyword>(`/keywords/${id}/toggle`, {
        method: 'PATCH',
      })
      const index = this.keywords.findIndex((k) => k.id === id)
      if (index !== -1) {
        this.keywords[index] = updated
      }
      return updated
    },

    async remove(id: number) {
      await $api(`/keywords/${id}`, { method: 'DELETE' })
      this.keywords = this.keywords.filter((k) => k.id !== id)
    },
  },
})
