#!/usr/bin/env bash
# deploy.sh — deploy the website from this repo (ETP) to the ITP mirror.
# Run manually whenever you want ITP to catch up with pushed changes.
set -euo pipefail

REMOTE_HOST="itp"
REMOTE_PATH="/export/web/users/abal"
LOCAL_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Pulling latest code on itp"
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && git pull --ff-only"

echo "==> Syncing assets (gitignored content) to itp"
rsync -az --delete \
  --exclude='.git/' \
  --exclude='.claude/' \
  --exclude='.DS_Store' \
  --exclude='._.DS_Store' \
  --exclude='__pycache__/' \
  --exclude='*.pyc' \
  --exclude='*.bak' --exclude='*.tmp' --exclude='*.old' \
  --exclude='.env' --exclude='.env.*' \
  --exclude='.htpasswd' \
  "$LOCAL_PATH/" "$REMOTE_HOST:$REMOTE_PATH/"

echo "==> Deploy complete"
