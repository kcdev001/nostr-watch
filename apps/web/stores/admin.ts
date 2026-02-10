import { defineStore } from 'pinia'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    authenticated: false,
  }),

  actions: {
    async verify(secretKey: string): Promise<boolean> {
      try {
        await $api('/auth/verify', {
          method: 'POST',
          body: { secretKey },
        })
        this.authenticated = true
        return true
      } catch {
        this.authenticated = false
        return false
      }
    },

    logout() {
      this.authenticated = false
    },
  },
})
