#!/bin/sh
# Pre-start environment validation for Railway deployment
# Ensures required environment variables are set before starting the app

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

MISSING=0

if [ -z "$DATABASE_URL" ]; then
  echo "${RED}ERROR: DATABASE_URL is not set.${NC}"
  echo ""
  echo "To fix this in Railway:"
  echo "  1. Add a PostgreSQL service to your Railway project"
  echo "  2. Go to your backend service → Variables"
  echo "  3. Click 'Add a variable reference' or add manually:"
  echo "     DATABASE_URL = \${{Postgres.DATABASE_URL}}"
  echo ""
  echo "  If your Postgres service has a different name (e.g. 'db'), use:"
  echo "     DATABASE_URL = \${{db.DATABASE_URL}}"
  echo ""
  MISSING=1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "${YELLOW}WARNING: JWT_SECRET is not set. The server will refuse to start.${NC}"
  echo "  Add JWT_SECRET to your Railway service variables (min 32 characters)."
  echo ""
fi

if [ "$MISSING" -eq 1 ]; then
  echo "${RED}Exiting due to missing required environment variables.${NC}"
  exit 1
fi

echo "Environment check passed."
