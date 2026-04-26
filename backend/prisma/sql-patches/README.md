# SQL Patches

Hand-written incremental SQL migrations applied directly via `psql` on prod.

## Why this directory exists

The repo's `prisma/migrations/` history is broken (out-of-order migrations, shadow DB
fails). `prisma migrate deploy` is therefore unusable. Rebaselining is risky on a live
prod DB. Until the migration history is cleaned up, all schema changes follow this flow:

- **Local**: edit `schema.prisma` → `npx prisma db push --skip-generate && npx prisma generate`
- **Prod**: write a SQL file here → apply via `psql` → restart service

## Naming

`YYYY-MM-DD_short_description.sql` — applied in date order.

## How to apply on prod

```bash
ssh ativa
# inside the Windows shell:
psql -U postgres -d gold_inventory_db -f "D:\AI websites\Sidharth Gold Inventory Site\Sidharth Gold Inventory Site\backend\prisma\sql-patches\<file>.sql"
```

Wrap every patch in `BEGIN; … COMMIT;` so a failure rolls back atomically.
