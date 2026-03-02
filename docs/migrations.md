# Migration System

## Overview

Forward-only sequential migrations for file-based storage. Meta tracked in `useStorage('migration-meta')` key `state`. The Nitro plugin runs migrations at boot and calls `process.exit(1)` on failure.

## When to Migrate

**Migration needed:**
- Renaming a field
- Changing a field's structure
- Changing enum values
- Removing stale data

**No migration needed:**
- Adding a new optional (`?`) field
- Adding a new storage namespace
- Changing query logic or routes

## Creating a Migration

### 1. Create the migration file

`server/system/migration/migrations/NNNN-name.ts`:

```ts
import { MigrationName, MigrationVersion } from '~/system/migration/primitives'
import type { Migration } from '~/system/migration/types'

export const migration0002: Migration = {
  version: MigrationVersion(2),
  name: MigrationName('rename-foo-to-bar'),
  migrate: async (ctx) => {
    const storage = ctx.storage('my-namespace')
    const keys = await storage.getKeys()
    let transformed = 0

    for (const key of keys) {
      const item = await storage.getItem(key)
      if (!item || typeof item !== 'object') continue

      const record = item as Record<string, unknown>
      if ('foo' in record) {
        record.bar = record.foo
        delete record.foo
        await storage.setItem(key, record)
        transformed++
      }
    }

    return { ok: true, transformed }
  },
}
```

### 2. Register in `migrations/index.ts`

```ts
import { migration0001 } from '~/system/migration/migrations/0001-init'
import { migration0002 } from '~/system/migration/migrations/0002-rename-foo-to-bar'
import type { Migration } from '~/system/migration/types'

export const migrations: Migration[] = [migration0001, migration0002]
```

## How It Works

1. On boot, the migration plugin calls `runMigrations(migrations)`
2. The runner reads `migration-meta:state` to get the current version
3. Pending migrations (version > current) are sorted and applied sequentially
4. Each migration receives a `MigrationContext` with `storage()` accessor
5. On success, meta is updated with the new version
6. On failure, the server exits with code 1

## Test Reset

`server/routes/test/reset.post.ts` clears `migration-meta` so migrations re-run on next boot. Add your domain namespaces to the reset list.

## Rules

- Migration `version` uses branded `MigrationVersion` (starts at 1, version 0 is reserved sentinel)
- Migrations return `MigrationResult`: `{ ok: true, transformed: number }` or `{ ok: false, error: string }`
- The runner wraps each migration in try/catch — migrations don't need their own error handling
- Migrations are forward-only, no rollback mechanism
