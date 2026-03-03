# Backend Architecture

## Overview

The backend follows a Domain-Driven Design (DDD) architecture built on [Nitro](https://nitro.build/) with TypeScript, file-based storage, and branded types.

## Directory Structure

```
server/
├── domain/           # Business logic (DDD bounded contexts)
│   ├── shared/       # Shared types across domains (Eur, Year, etc.)
│   └── {domain}/     # One folder per domain
│       ├── types.ts       # Domain types (branded)
│       ├── primitives.ts  # Zod validation constructors
│       ├── repository.ts  # Data access (private to domain)
│       ├── query.ts       # Read operations (public)
│       └── command.ts     # Write operations (public)
├── routes/           # HTTP endpoints (auto-scanned by Nitro)
├── middleware/        # Request middleware (auth)
├── plugins/           # Nitro plugins (sentry, migration, cache)
├── system/            # Infrastructure (config, migration, sentry)
└── types/             # TypeScript declarations
```

## Layers

### Domain Layer (`server/domain/`)

Each domain is a self-contained bounded context:

- **types.ts** — Branded types using `ts-brand`
- **primitives.ts** — Zod constructors that validate and brand raw values
- **repository.ts** — File-based storage access (private, never imported from outside the domain)
- **query.ts** — Public read operations (exported namespace)
- **command.ts** — Public write operations (exported namespace)

### Route Layer (`server/routes/`)

HTTP handlers that validate input at the boundary, call domain queries/commands, and return responses.

### System Layer (`server/system/`)

Infrastructure concerns: config, migration, Sentry instrumentation, request caching.

## Cross-Domain Rules

1. **Repositories are private** — A repository can only be used within its own domain (`command.ts`, `query.ts`). Other domains access data through public `Query` namespaces.
2. **Validation at domain boundary** — All data entering a domain is validated/branded. No re-validation internally.
3. **No domain-to-domain imports** — Domains communicate through their public Query/Command namespaces, never by importing each other's repositories or types directly.

## Data Flow

```
HTTP Request
  → middleware/auth.ts (Bearer token validation)
  → routes/{path}.ts (input validation via Zod)
  → domain/{domain}/command.ts or query.ts
  → domain/{domain}/repository.ts (storage access)
  → HTTP Response { status, data }
```

## Storage

File-based storage via Nitro's `useStorage()`. Each domain gets its own namespace configured in `nitro.config.ts`:

```ts
storage: {
  'migration-meta': { driver: 'fs', base: './.data/db/migration-meta' },
  example: { driver: 'fs', base: './.data/db/example' },
}
```

## Sentry Integration

- Domain commands and queries are auto-instrumented with Sentry tracing
- Storage operations are wrapped with spans (including `cache.hit` attribute)
- HTTP requests get server spans with route name normalization
- Errors (5xx only) are captured automatically

## Logging

Structured logging via [consola](https://github.com/unjs/consola) (transitive dependency of Nitro). Each module creates a tagged logger:

```ts
import { createLogger } from '~/system/logger'

const log = createLogger('my-tag')

log.info('Something happened', { details })
log.error('Something failed')
```

The factory is in `server/system/logger.ts`. Tags appear in log output for easy filtering.
