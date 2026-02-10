import type { UseFetchOptions } from 'nuxt/app'

export function useApi<T>(path: string | (() => string), options?: UseFetchOptions<T>) {
  const config = useRuntimeConfig()
  const url = computed(() => {
    const p = typeof path === 'function' ? path() : path
    return `${config.public.apiBase}${p}`
  })

  return useFetch<T>(url, {
    ...options,
  })
}

export function $api<T>(path: string, options?: Parameters<typeof $fetch>[1]) {
  const config = useRuntimeConfig()
  return $fetch<T>(`${config.public.apiBase}${path}`, options)
}
