# Adding a New Domain

Step-by-step guide to adding a new domain to the backend. Each step corresponds to a DDD building block from Evans (*Domain-Driven Design*) or Wlashin (*Domain Modeling Made Functional*).

## 1. Create the Domain Directory

```
server/domain/wine/
├── types.ts
├── primitives.ts
├── repository.ts
├── query.ts
└── command.ts
```

## 2. Define Types (`types.ts`)

> **Evans:** Value Objects (types defined by their value, not an identity) and Entities (types with an `id`). **Wlashin:** types as documentation — the type definition IS the domain model specification.

```ts
import type { Brand } from 'ts-brand'
import type { Eur, Year, Country } from '~/domain/shared/types'

export type WineId = Brand<string, 'WineId'>
export type WineColor = 'red' | 'white' | 'rose'

export type Wine = {
  id: WineId
  name: string
  color: WineColor
  country: Country
  year: Year
  price: Eur
  createdAt: Date
}
```

## 3. Create Primitives (`primitives.ts`)

> **Wlashin:** making illegal states unrepresentable — if a value passes the Zod constructor, it is guaranteed valid throughout the system. No downstream code needs to re-validate.

```ts
import { make } from 'ts-brand'
import { z } from 'zod'
import type { WineColor, WineId as WineIdType } from '~/domain/wine/types'

export const WineId = (value: unknown) => {
  const v = z.string().uuid().parse(value)
  return make<WineIdType>()(v)
}

export const wineColors = ['red', 'white', 'rose'] as const

export const WineColor = (value: unknown) =>
  z.enum(wineColors).parse(value) as WineColor
```

## 4. Create Repository (`repository.ts`)

> **Evans:** Repository pattern — provides a collection-like interface for accessing domain objects while hiding persistence details. Private to the bounded context.

```ts
import type { Wine, WineId } from '~/domain/wine/types'

const storage = () => useStorage<Wine>('wines')

export namespace WineRepository {
  export const findById = async (id: WineId) =>
    storage().getItem(id)

  export const findAll = async () => {
    const keys = await storage().getKeys()
    const items = await storage().getItems(keys.map((key) => ({ key })))
    return items.map(({ value }) => value).filter((v): v is Wine => v !== null)
  }

  export const save = async (wine: Wine) =>
    storage().setItem(wine.id, wine)

  export const remove = async (id: WineId) =>
    storage().removeItem(id)
}
```

## 5. Create Query (`query.ts`)

> **Evans:** the Query namespace is the bounded context's public read interface. Other domains interact through this contract, never through the repository.

```ts
import { WineRepository } from '~/domain/wine/repository'

export namespace WineQuery {
  export const getAll = async () =>
    WineRepository.findAll()

  export const getById = async (id: WineId) =>
    WineRepository.findById(id)
}
```

## 6. Create Command (`command.ts`)

> **Evans:** Command as the bounded context's public write interface. **Wlashin:** Railway-Oriented Programming — each outcome is a track, and discriminated unions make every possible result explicit.
>
> **Result types are rare and business-oriented.** Outcomes are simple strings (`'created'`, `'not-found'`). Use them only when the domain has multiple legitimate outcomes. If a state is functionally impossible (data that should exist but doesn't) → `throw`, don't return a Result. See [error-handling.md](./error-handling.md).

```ts
import { WineRepository } from '~/domain/wine/repository'
import type { Wine } from '~/domain/wine/types'

export namespace WineCommand {
  export const create = async (wine: Wine) => {
    await WineRepository.save(wine)
    return { outcome: 'created' as const, wine }
  }

  export const remove = async (id: WineId) => {
    const existing = await WineRepository.findById(id)
    if (!existing) return { outcome: 'not-found' as const }
    await WineRepository.remove(id)
    return { outcome: 'removed' as const }
  }
}
```

## 7. Register Storage in `nitro.config.ts`

```ts
storage: {
  'migration-meta': { driver: 'fs', base: './.data/db/migration-meta' },
  wines: { driver: 'fs', base: './.data/db/wines' },
},
```

## 8. Add Routes (`server/routes/wines/`)

Create route files following the [API patterns](./api-patterns.md).

## 9. Update Test Reset

Add the storage namespace to `server/routes/test/reset.post.ts`:

```ts
for (const name of [
  'migration-meta',
  'wines',
]) {
```

## Optional: Use Case (`use-case.ts`)

> **Evans:** Application Service — orchestrates operations across multiple bounded contexts without owning business logic itself.

When a route needs to orchestrate multiple domains (e.g. create a wine AND record a tasting), extract a use case:

```ts
import { WineCommand } from '~/domain/wine/command'
import { TastingCommand } from '~/domain/tasting/command'

export namespace WineUseCase {
  export const addWithTasting = async (wineData: ..., tastingData?: ...) => {
    const wine = await WineCommand.add(wineData)
    if (tastingData) await TastingCommand.create({ wineId: wine.id, ...tastingData })
    return wine
  }
}
```

**Rules:**
- Names carry business intent (`addWithTasting`, `removeCompletely` — never `handleX`, `processX`)
- No direct storage access (`useStorage`) — go through commands/queries
- The route becomes a single line: validate input → call use case → return response

## Optional: Business Rules (`business-rules.ts`)

> **Wlashin:** pure domain functions — all business logic is expressed as pure functions with no IO, making it trivially testable and easy to reason about.

When command logic becomes complex, extract pure functions (no IO, no async):

```ts
export const wineStatus = (context: {
  inCellar: boolean
  gifted: boolean
  recommended: boolean
}): WineStatus => {
  if (context.inCellar) return 'in-cellar'
  if (context.gifted) return 'gifted'
  if (context.recommended) return 'recommended'
  return 'consumed'
}
```

**Rules:**
- Function names ARE the business concept (`wineStatus`, `readyToDrink` — never `computeX`, `getX`)
- No IO, no async, no `useStorage` — pure input/output
- Must have 100% test coverage (`business-rules.unit.test.ts`)

## Optional: Read Model (`server/read-model/{domain}/`)

> This is the Query Model / read side of CQRS — a dedicated projection optimized for display, assembled from multiple bounded contexts.

When a route needs a composite view assembling data from multiple domains:

```ts
// server/read-model/wine/wine-list.ts
import { WineQuery } from '~/domain/wine/query'
import { TastingQuery } from '~/domain/tasting/query'

export namespace WineListReadModel {
  export const all = async () => {
    const [wines, tastings] = await Promise.all([
      WineQuery.findAll(),
      TastingQuery.getAll(),
    ])
    // ... assemble the view
  }
}
```

**Rules:**
- Lives in `server/read-model/{domain}/` — mirrors the domain structure
- Only imports public Query/Command namespaces — never repositories
- Names describe the view (`wine-list`, `wine-detail`, `overview`)

## 10. Write Feature Tests (`*.feat.test.ts`)

Feature tests use the BDD DSL from `server/test/bdd.ts` to read as living documentation:

```ts
import { expect } from 'bun:test'
import { WineQuery } from '~/domain/wine/query'
import { and, feature, given, scenario, then, when } from '~/test/bdd'
import { mockEvent } from '~/test/setup'
import handler from './index.post'

feature('Creating a wine', () => {
  scenario('adding a wine with all fields', async () => {
    given('a valid wine payload')
    const event = mockEvent({
      body: { name: 'Château Margaux', color: 'red', country: 'France', year: 2018, price: 150 },
    })

    when('the wine is created')
    const result = await handler(event as any)

    then('the creation is confirmed')
    expect(result.status).toBe(201)
    expect(result.data.name as string).toBe('Château Margaux')

    and('the wine is persisted in the catalog')
    const wine = await WineQuery.getById(result.data.id)
    expect(wine).not.toBeNull()
  })
})
```

**Rules:**
- `feature()` = `describe`, `scenario()` = `test` — just aliases for readability
- `given`/`when`/`then`/`and` are documentation markers (`console.log`) — assertions use `expect()`
- One `.feat.test.ts` per route file, co-located next to the route
- Journey tests (multi-route lifecycle) go in `server/test/journeys.feat.test.ts`

## Checklist

- [ ] `types.ts` with branded types
- [ ] `primitives.ts` with Zod constructors
- [ ] `repository.ts` (private to domain)
- [ ] `query.ts` (public read namespace)
- [ ] `command.ts` (public write namespace)
- [ ] Storage namespace in `nitro.config.ts`
- [ ] Route handlers in `server/routes/`
- [ ] Feature tests (`*.feat.test.ts`) for each route
- [ ] Test reset updated
- [ ] `bunx nitro prepare && bun tsc --noEmit` passes
- [ ] (optional) `use-case.ts` if multi-domain orchestration needed
- [ ] (optional) `business-rules.ts` with 100% test coverage if complex logic
- [ ] (optional) `server/read-model/{domain}/` if composite views needed
