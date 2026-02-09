#!/usr/bin/env bash
# Nostr Watch - API Verification Script
# Usage: bash scripts/verify-api.sh

BASE_URL="http://localhost:3100/api"
PASSED=0
FAILED=0
TOTAL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Use -q to disable .curlrc, -o to write body to temp file, -w for status code only
TMPFILE=$(mktemp)
trap "rm -f $TMPFILE" EXIT

do_curl() {
  local method="$1"
  local url="$2"
  local body="$3"

  if [ "$method" = "POST" ] && [ -n "$body" ]; then
    HTTP_CODE=$(curl -q -s -o "$TMPFILE" -w "%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$body" 2>/dev/null)
  elif [ "$method" = "POST" ]; then
    HTTP_CODE=$(curl -q -s -o "$TMPFILE" -w "%{http_code}" -X POST "$url" 2>/dev/null)
  else
    HTTP_CODE=$(curl -q -s -o "$TMPFILE" -w "%{http_code}" "$url" 2>/dev/null)
  fi
  BODY=$(cat "$TMPFILE")
}

check() {
  local name="$1"
  local url="$2"
  local method="${3:-GET}"
  local body="$4"
  local expect_status="${5:-200}"

  TOTAL=$((TOTAL + 1))
  printf "${YELLOW}[TEST %02d]${NC} %-50s " "$TOTAL" "$name"

  do_curl "$method" "$url" "$body"

  if [ "$HTTP_CODE" = "$expect_status" ]; then
    printf "${GREEN}PASS${NC} (HTTP %s)\n" "$HTTP_CODE"
    PASSED=$((PASSED + 1))
    return 0
  else
    printf "${RED}FAIL${NC} (expected %s, got %s)\n" "$expect_status" "$HTTP_CODE"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

check_json_expr() {
  local name="$1"
  local url="$2"
  local expr="$3"

  TOTAL=$((TOTAL + 1))
  printf "${YELLOW}[TEST %02d]${NC} %-50s " "$TOTAL" "$name"

  do_curl "GET" "$url"
  RESULT=$(echo "$BODY" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    print('OK' if ($expr) else 'FAIL')
except Exception as e:
    print(f'ERROR: {e}')
" 2>/dev/null)

  if [ "$RESULT" = "OK" ]; then
    printf "${GREEN}PASS${NC}\n"
    PASSED=$((PASSED + 1))
  else
    printf "${RED}FAIL${NC} (%s)\n" "$RESULT"
    FAILED=$((FAILED + 1))
  fi
}

echo ""
echo "========================================"
echo "  Nostr Watch API Verification"
echo "  Server: $BASE_URL"
echo "========================================"
echo ""

# ─── 1. Crawler Status ─────────────────────────────
echo "--- Crawler Status ---"
check "GET /nostr/status returns 200" "$BASE_URL/nostr/status"
check_json_expr "Crawler is running" "$BASE_URL/nostr/status" "d['isRunning'] == True"
check_json_expr "Has active subscriptions" "$BASE_URL/nostr/status" "d['activeSubscriptions'] >= 1"
check_json_expr "Dedup cache warmed up" "$BASE_URL/nostr/status" "d['seenCacheSize'] > 0"
echo ""

# ─── 2. Stats ──────────────────────────────────────
echo "--- Data Stats ---"
check "GET /events/stats returns 200" "$BASE_URL/events/stats"
check_json_expr "Has events in DB" "$BASE_URL/events/stats" "d['totalEvents'] > 0"
echo ""

# ─── 3. Keywords CRUD ─────────────────────────────
echo "--- Keywords ---"
check "GET /keywords returns 200" "$BASE_URL/keywords"
check_json_expr "Has default keywords" "$BASE_URL/keywords" "len(d) >= 5"
echo ""

# ─── 4. Events API ────────────────────────────────
echo "--- Events API ---"
check "GET /events returns 200" "$BASE_URL/events?page=1&limit=5"
check_json_expr "Events have pagination" "$BASE_URL/events?limit=5" "'items' in d and 'total' in d and 'pages' in d"
check_json_expr "Events have author field" "$BASE_URL/events?limit=1" "len(d['items']) == 0 or 'author' in d['items'][0]"

check "GET /events/:id invalid returns 200" "$BASE_URL/events/nonexistent_id_12345"

check "GET /events/keyword/Bitcoin returns 200" "$BASE_URL/events/keyword/Bitcoin?limit=5"
echo ""

# ─── 5. Search Validation ─────────────────────────
echo "--- Search Validation ---"
check "Search with valid query returns 200" "$BASE_URL/events/search?q=bitcoin&limit=5"
check "Search with 1 char returns 400" "$BASE_URL/events/search?q=a" "GET" "" "400"
check "Search with empty query returns 400" "$BASE_URL/events/search?q=" "GET" "" "400"
echo ""

# ─── 6. Limit Cap ─────────────────────────────────
echo "--- Limit Cap ---"
check_json_expr "Limit capped at 100 (events)" "$BASE_URL/events?limit=999" "d['limit'] <= 100"
echo ""

# ─── 7. Trending API ──────────────────────────────
echo "--- Trending API ---"
check "GET /trending returns 200" "$BASE_URL/trending?period=day&limit=5"
check "GET /trending/keyword/:kw returns 200" "$BASE_URL/trending/keyword/Bitcoin?limit=5"
check "GET /trending/authors returns 200" "$BASE_URL/trending/authors?period=week&limit=5"
echo ""

# ─── 8. XSS Protection ────────────────────────────
echo "--- XSS Protection ---"
TOTAL=$((TOTAL + 1))
printf "${YELLOW}[TEST %02d]${NC} %-50s " "$TOTAL" "Content is HTML-escaped"
do_curl "GET" "$BASE_URL/events?limit=10"
XSS_RESULT=$(echo "$BODY" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d.get('items', [])
if not items:
    print('SKIP')
else:
    has_raw_script = any('<script' in i.get('content','') for i in items)
    if has_raw_script:
        print('FAIL')
    else:
        print('OK')
" 2>/dev/null)

if [ "$XSS_RESULT" = "FAIL" ]; then
  printf "${RED}FAIL${NC} (raw <script> found)\n"
  FAILED=$((FAILED + 1))
elif [ "$XSS_RESULT" = "SKIP" ]; then
  printf "${YELLOW}SKIP${NC} (no events to check)\n"
else
  printf "${GREEN}PASS${NC}\n"
  PASSED=$((PASSED + 1))
fi
echo ""

# ─── 9. Crawler Restart ──────────────────────────
echo "--- Crawler Restart ---"
check "POST /nostr/restart returns 201" "$BASE_URL/nostr/restart" "POST" "" "201"
sleep 1
check_json_expr "Crawler running after restart" "$BASE_URL/nostr/status" "d['isRunning'] == True"
echo ""

# ─── Summary ──────────────────────────────────────
echo "========================================"
printf "  Results: ${GREEN}%d passed${NC}, ${RED}%d failed${NC}, %d total\n" "$PASSED" "$FAILED" "$TOTAL"
echo "========================================"

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
exit 0
