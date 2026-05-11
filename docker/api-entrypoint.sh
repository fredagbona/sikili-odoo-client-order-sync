#!/bin/sh
set -e
cd /app/packages/database
pnpm exec prisma migrate deploy
exec node /app/apps/api/dist/index.js
