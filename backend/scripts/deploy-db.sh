#!/bin/sh
# Database deployment script for Railway
# Handles the case where the database already has tables from a previous
# deployment (e.g., via `prisma db push`) but no migration history.
#
# This script:
# 1. Runs `prisma migrate deploy` to apply any pending migrations (skippable via SKIP_MIGRATE=true)
# 2. Optionally runs `prisma db seed` only when explicitly enabled
#
# Environment variables:
#   SKIP_MIGRATE=true          — Skip migrations on startup (use for restarts when schema is stable)
#   RUN_DB_SEED_ON_STARTUP=true — Run seed on startup for one-time initialization
#
# NOTE:
# - Set SKIP_MIGRATE=true in Railway variables when schema is already up-to-date.
#   This dramatically speeds up container restarts (avoids 30+ second migration step).
# - Only set SKIP_MIGRATE=false (or unset) when you've pushed new schema changes.

set -e

echo "=== Database Migration ==="

if [ "${SKIP_MIGRATE:-false}" = "true" ]; then
  echo "=== SKIP_MIGRATE=true: skipping prisma migrate deploy (schema already up-to-date) ==="
else
  echo "Applying migrations with prisma migrate deploy..."
  npx prisma migrate deploy
  echo "=== Database migration complete ==="
fi

echo ""
if [ "${RUN_DB_SEED_ON_STARTUP:-false}" = "true" ]; then
  echo "=== RUN_DB_SEED_ON_STARTUP=true, running prisma db seed ==="
  npx prisma db seed
  echo "=== Database seed complete ==="
else
  echo "=== Seed skipped on startup (default). Set RUN_DB_SEED_ON_STARTUP=true for one-time initialization. ==="
fi
