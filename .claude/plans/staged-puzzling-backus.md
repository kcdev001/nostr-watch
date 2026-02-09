# Nostr Watch - Implementation Plan

## Context
Build a Nostr data crawler and analysis platform that tracks keywords (BTC, Bitcoin, Keychat, Signal, Damus), trending posts, and important accounts from the Nostr network. Display data in a real-time web interface with timeline view.

## Tech Stack
- **Backend**: NestJS + TypeORM + MariaDB
- **Frontend**: Nuxt 3 + Nuxt UI + Pinia (Phase 2, after backend is working)
- **Nostr**: nostr-tools (SimplePool for relay management)
- **Monorepo**: pnpm workspaces
- **Real-time**: WebSocket (Socket.io)

## Monorepo Structure
```
nostr-watch/
├── package.json              # Root workspace config
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env
├── apps/
│   ├── server/               # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── nostr/        # Nostr relay connection & crawling
│   │   │   │   ├── events/       # Event storage & query API
│   │   │   │   ├── keywords/     # Keyword management
│   │   │   │   └── trending/     # Trending calculation
│   │   │   ├── entities/         # TypeORM entities
│   │   │   ├── gateway/          # WebSocket gateway (Socket.io)
│   │   │   └── main.ts
│   │   └── package.json
│   └── web/                  # Nuxt 3 frontend
│       ├── pages/
│       │   ├── index.vue         # Dashboard / trending
│       │   ├── keywords/
│       │   │   └── [keyword].vue # Keyword timeline
│       │   └── event/
│       │       └── [id].vue      # Event detail
│       ├── components/
│       ├── composables/
│       └── package.json
└── packages/
    └── shared/               # Shared types
        └── src/
            └── types.ts
```

## Database Schema (MariaDB)
```
nostr_events:
  - id (PK, varchar) - Nostr event ID
  - pubkey (varchar, indexed)
  - kind (int, indexed)
  - content (text)
  - tags (json)
  - created_at (int, indexed) - Unix timestamp
  - relay_url (varchar)
  - fetched_at (datetime)

nostr_profiles:
  - pubkey (PK, varchar)
  - name (varchar)
  - display_name (varchar)
  - about (text)
  - picture (varchar)
  - nip05 (varchar)
  - updated_at (datetime)

keywords:
  - id (PK, auto)
  - keyword (varchar, unique)
  - is_active (boolean)
  - created_at (datetime)

event_keywords:
  - event_id (FK -> nostr_events.id)
  - keyword_id (FK -> keywords.id)
```

## Relay List (Free, No API Key)
- wss://relay.damus.io
- wss://nos.lol
- wss://relay.nostr.band
- wss://relay.snort.social
- wss://offchain.pub
- wss://nostr.wine (partial free)

## Build Phases

### Phase 1: Project Scaffolding
1. Initialize pnpm workspace with root package.json and pnpm-workspace.yaml
2. Create NestJS app in apps/server (nest new)
3. Create Nuxt 3 app in apps/web (nuxi init)
4. Create shared types package in packages/shared
5. Configure TypeScript, ESLint
6. Configure TypeORM for MariaDB connection

### Phase 2: Backend Core - Nostr Crawler
1. Create TypeORM entities (nostr_events, nostr_profiles, keywords, event_keywords)
2. Build NostrModule with NostrService:
   - Use nostr-tools SimplePool to connect to multiple relays
   - Subscribe to kind:1 (text notes) events containing tracked keywords
   - Parse and store matching events to DB
3. Build EventsModule with CRUD API for querying stored events
4. Build KeywordsModule for managing tracked keywords
5. Add @nestjs/schedule for periodic crawling tasks

### Phase 3: Backend - Real-time & Trending
1. Build WebSocket gateway (Socket.io) to push new events to frontend
2. Build TrendingModule:
   - Calculate trending posts by engagement (reactions, reposts)
   - Daily and weekly trending endpoints
3. Fetch user profiles (kind:0) for event authors

### Phase 4: Frontend - Core Pages
1. Setup Nuxt UI for component library
2. Build layout (sidebar navigation, header)
3. Dashboard page: show trending posts (daily/weekly)
4. Keyword page: timeline view filtered by keyword
5. Event detail page: show post, comments, reactions
6. WebSocket integration for real-time updates

### Phase 5: Polish & Deploy
1. Error handling and edge cases
2. Responsive design
3. Loading states, empty states
4. Docker Compose for deployment (server + web + MariaDB)
5. Environment configuration

## Verification
1. Start MariaDB, run `pnpm dev` to start both apps
2. Check server connects to relays and starts crawling
3. Verify events appear in DB
4. Open web UI, check trending page loads data
5. Navigate to keyword page, verify timeline updates in real-time
6. Test WebSocket: new events should appear without page refresh

## Execution Order
**先做后端，后做前端。** Backend working with real data first, then build frontend.

## First Milestone (Phase 1 + 2)
A working backend that connects to Nostr relays, crawls keyword-matching events, stores them in MariaDB, and exposes REST API endpoints. This is what we'll build first.

## Second Milestone (Phase 3)
Real-time WebSocket push + trending calculation.

## Third Milestone (Phase 4 + 5)
Nuxt 3 + Nuxt UI frontend, then polish and deploy.
