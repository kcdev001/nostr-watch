# Nostr Watch

Nostr data crawler and analysis platform. Tracks keywords, trending posts, and important accounts from the Nostr network.

## Architecture

```
nostr-watch/
├── apps/
│   ├── server/          # NestJS backend (port 3100)
│   └── web/             # Nuxt 3 frontend (port 3000, WIP)
├── packages/
│   └── shared/          # Shared TypeScript types
├── .env                 # Environment config
└── pnpm-workspace.yaml  # Monorepo config
```

### Design Overview

**Data Flow:**

```
Nostr Relays (WebSocket)
     ↓
NostrService (crawler, server-side) → MariaDB → REST API → Frontend
     ↓                                                        ↓
 Engagement fetcher                              nostr-tools (client-side)
 (reactions/reposts)                              ↓
                                            Nostr Relays (real-time via WebSocket)
```

1. **Backend NostrService** connects to multiple free Nostr relays via WebSocket using `nostr-tools` SimplePool
2. Subscribes to kind:1 (text notes) events, filters by tracked keywords in content
3. Matching events are persisted to MariaDB with keyword associations
4. User profiles (kind:0) are fetched periodically for event authors
5. Engagement data (reactions/reposts/replies) fetched every 10 minutes for trending calculation
6. REST API exposes stored data, search, and trending rankings
7. **Frontend** uses `nostr-tools` directly to connect to Nostr relays for real-time updates (native WebSocket, no Socket.io middleman)

**Relay List (free, no API key):**
- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.nostr.band`
- `wss://relay.snort.social`
- `wss://offchain.pub`

### Database Schema

| Table | Purpose |
|-------|---------|
| `nostr_events` | Stored Nostr events (text notes) |
| `nostr_profiles` | Author profile metadata |
| `keywords` | Tracked keywords (BTC, Bitcoin, etc.) |
| `event_keywords` | Many-to-many: event ↔ keyword |

## Setup

### Prerequisites
- Node.js >= 18 (via nvm)
- pnpm
- MariaDB

### Install & Run

```bash
# Install dependencies
pnpm install

# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS nostr_watch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Configure .env (already provided)
# ORM_HOST, ORM_PORT, ORM_USERNAME, ORM_PASSWORD, ORM_DATABASE

# Start backend
pnpm dev:server

# Start frontend (WIP)
pnpm dev:web

# Start both
pnpm dev
```

## API Reference

Base URL: `http://localhost:3100/api`

### Events

#### `GET /api/events`
Get recent events (all keywords), paginated.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | query, int | 1 | Page number |
| `limit` | query, int | 20 | Items per page |

Response:
```json
{
  "items": [
    {
      "id": "abc123...",
      "pubkey": "def456...",
      "kind": 1,
      "content": "Bitcoin is pumping!",
      "tags": [],
      "createdAt": 1707436800,
      "relayUrl": null,
      "fetchedAt": "2026-02-09T12:00:00.000Z",
      "keywords": [{ "id": 1, "keyword": "Bitcoin" }],
      "author": {
        "pubkey": "def456...",
        "name": "satoshi",
        "displayName": "Satoshi Nakamoto",
        "picture": "https://...",
        "nip05": "satoshi@example.com"
      }
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

#### `GET /api/events/search`
Full-text search in event content.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | query, string | - | Search query (e.g. `lightning network`) |
| `page` | query, int | 1 | Page number |
| `limit` | query, int | 20 | Items per page |

Example: `GET /api/events/search?q=lightning+network&limit=10`

#### `GET /api/events/keyword/:keyword`
Get events matching a specific keyword.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `keyword` | path, string | - | Keyword to filter by (e.g. `BTC`) |
| `page` | query, int | 1 | Page number |
| `limit` | query, int | 20 | Items per page |

Example: `GET /api/events/keyword/BTC?page=1&limit=10`

#### `GET /api/events/:id`
Get a single event by Nostr event ID.

Example: `GET /api/events/abc123def456...`

#### `GET /api/events/stats`
Get crawling statistics.

Response:
```json
{
  "totalEvents": 1500,
  "totalProfiles": 320,
  "todayEvents": 85
}
```

### Keywords

#### `GET /api/keywords`
List all tracked keywords.

Response:
```json
[
  { "id": 1, "keyword": "BTC", "isActive": true, "createdAt": "..." },
  { "id": 2, "keyword": "Bitcoin", "isActive": true, "createdAt": "..." }
]
```

#### `POST /api/keywords`
Add a new keyword to track.

Body: `{ "keyword": "Ethereum" }`

#### `PATCH /api/keywords/:id/toggle`
Toggle a keyword active/inactive.

#### `DELETE /api/keywords/:id`
Remove a keyword.

### Trending

#### `GET /api/trending`
Get trending events ranked by engagement (reactions + reposts * 2 + replies).

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | query, string | `day` | `day` or `week` |
| `limit` | query, int | 20 | Max results |

#### `GET /api/trending/keyword/:keyword`
Get trending events for a specific keyword.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `keyword` | path, string | - | Keyword to filter |
| `period` | query, string | `day` | `day` or `week` |
| `limit` | query, int | 20 | Max results |

#### `GET /api/trending/authors`
Get most active authors ranked by event count and total reactions.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | query, string | `week` | `day` or `week` |
| `limit` | query, int | 20 | Max results |

Response:
```json
[
  {
    "pubkey": "abc123...",
    "eventCount": 15,
    "totalReactions": 230,
    "profile": { "name": "satoshi", "displayName": "Satoshi", "picture": "..." }
  }
]
```

### Nostr Crawler

#### `GET /api/nostr/status`
Get crawler status.

Response:
```json
{
  "isRunning": true,
  "relays": ["wss://relay.damus.io", "..."],
  "activeSubscriptions": 1
}
```

#### `POST /api/nostr/restart`
Restart the crawler (reconnect to relays, refresh keyword subscriptions).

## Default Keywords
The following keywords are seeded on first startup:
- BTC
- Bitcoin
- Keychat
- Signal
- Damus

## Tech Stack
- **Backend**: NestJS 10 + TypeORM + MariaDB
- **Frontend**: Nuxt 3 + Nuxt UI (WIP)
- **Nostr**: nostr-tools v2 (SimplePool)
- **Monorepo**: pnpm workspaces
- **Real-time**: Frontend connects to Nostr relays directly via nostr-tools (native WebSocket)

## License
MIT
