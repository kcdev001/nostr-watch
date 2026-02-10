export interface NostrProfile {
  pubkey: string
  name: string | null
  displayName: string | null
  about: string | null
  picture: string | null
  nip05: string | null
  updatedAt: string
}

export interface Keyword {
  id: number
  keyword: string
  groupName: string | null
  isActive: boolean
  createdAt: string
}

export interface KeywordGroup {
  name: string
  keywords: string[]
}

export interface NostrEvent {
  id: string
  pubkey: string
  kind: number
  content: string
  tags: string[][]
  createdAt: number
  relayUrl: string | null
  reactionCount: number
  repostCount: number
  replyCount: number
  engagementScore: number
  fetchedAt: string
  keywords?: Keyword[]
  author: NostrProfile | null
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface EventStats {
  totalEvents: number
  totalProfiles: number
  todayEvents: number
}

export interface CrawlerStatusData {
  isRunning: boolean
  relays: string[]
  activeSubscriptions: number
  writeQueueSize: number
  seenCacheSize: number
}

export interface TopAuthor {
  pubkey: string
  eventCount: number
  totalReactions: number
  profile: NostrProfile | null
}
