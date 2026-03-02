# Adding a New Domain

Step-by-step guide to adding a new domain to the backend.

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

## Checklist

- [ ] `types.ts` with branded types
- [ ] `primitives.ts` with Zod constructors
- [ ] `repository.ts` (private to domain)
- [ ] `query.ts` (public read namespace)
- [ ] `command.ts` (public write namespace)
- [ ] Storage namespace in `nitro.config.ts`
- [ ] Route handlers in `server/routes/`
- [ ] Test reset updated
- [ ] `bunx nitro prepare && bun tsc --noEmit` passes
