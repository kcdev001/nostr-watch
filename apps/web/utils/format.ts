export function timeAgo(unixTimestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - unixTimestamp
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(unixTimestamp * 1000).toLocaleDateString()
}

export function truncatePubkey(pubkey: string, chars = 8): string {
  if (pubkey.length <= chars * 2) return pubkey
  return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}
