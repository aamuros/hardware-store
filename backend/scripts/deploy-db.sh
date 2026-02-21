#!/bin/sh
# Database deployment script for Railway
# Handles the case where the database already has tables from a previous
# deployment (e.g., via `prisma db push`) but no migration history.
#
# This script:
# 1. Resolves any previously failed migrations
# 2. Baselines existing schemas so migrations don't try to recreate tables
# 3. Runs `prisma migrate deploy` to apply any pending migrations
# 4. Runs `prisma db seed` (idempotent — skips if already seeded)

set -e

echo "=== Database Migration ==="

# Step 1: Attempt a normal migrate deploy
echo "Attempting prisma migrate deploy..."
if npx prisma migrate deploy 2>&1; then
  echo "Migrations applied successfully."
else
  echo ""
  echo "migrate deploy failed — attempting recovery..."

  # Step 2: Resolve any failed migrations and mark them as rolled back,
  # then re-apply. This handles the P3009 "failed migration" blocker.
  # We also handle P3018 (tables already exist) by baselining.

  # Get list of migration directories
  MIGRATION_DIR="prisma/migrations"
  for dir in "$MIGRATION_DIR"/*/; do
    migration_name=$(basename "$dir")
    # Skip the lock file
    if [ "$migration_name" = "migration_lock.toml" ]; then
      continue
    fi

    echo "Resolving migration: $migration_name"
    
    # First, try to mark the failed migration as rolled back
    npx prisma migrate resolve --rolled-back "$migration_name" 2>/dev/null || true
    
    # Then mark it as already applied (baseline), since the tables exist
    npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
  done

  # Step 3: Run migrate deploy again to apply any remaining migrations
  echo ""
  echo "Retrying prisma migrate deploy..."
  npx prisma migrate deploy
fi

echo "=== Database migration complete ==="

# Step 4: Run idempotent seed (skips if products already exist)
echo ""
echo "=== Database Seed (idempotent) ==="
npx prisma db seed || echo "WARNING: Seed failed (non-fatal) — server will still start"
echo "=== Seed complete ==="
