#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/home/mobimpai}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
LOG_DIR="${LOG_DIR:-/var/log/mobimpai}"
LOCK="/tmp/mobimpai-auto-update.lock"

mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/auto-update.log"

exec >>"$LOG" 2>&1
echo "--- $(date -u +%FT%TZ) auto-update start (branch=$BRANCH) ---"

# Single-flight: exit if another run is still going
exec 9>"$LOCK"
if ! flock -n 9; then
    echo "another run in progress, skipping"
    exit 0
fi

cd "$REPO_DIR"

git fetch --quiet origin "$BRANCH"
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "up to date at ${LOCAL:0:8}"
    exit 0
fi

echo "updating ${LOCAL:0:8} -> ${REMOTE:0:8}"
git reset --hard "origin/$BRANCH"

# --build rebuilds only images whose context changed; --remove-orphans drops
# services that were deleted from the compose file.
docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans

echo "--- $(date -u +%FT%TZ) auto-update done ---"
