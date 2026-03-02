# API Route Patterns

## Response Envelope

All endpoints return a consistent envelope:

```ts
{ status: number, data: T }
```

## Route Conventions

Nitro uses file-based routing. File names map to HTTP methods:

```
server/routes/
├── wines/
│   ├── index.get.ts          # GET /wines
│   ├── index.post.ts         # POST /wines
│   └── [id]/
│       ├── index.get.ts      # GET /wines/:id
│       ├── index.put.ts      # PUT /wines/:id
│       └── index.delete.ts   # DELETE /wines/:id
```

## GET — List

```ts
import { WineQuery } from '~/domain/wine/query'

export default defineEventHandler(async () => {
  const wines = await WineQuery.getAll()
  return { status: 200, data: wines }
})
```

## GET — Single

```ts
import { WineId } from '~/domain/wine/primitives'
import { WineQuery } from '~/domain/wine/query'

export default defineEventHandler(async (event) => {
  const id = WineId(getRouterParam(event, 'id'))
  const wine = await WineQuery.getById(id)
  if (!wine) throw createError({ statusCode: 404, statusMessage: 'Wine not found' })
  return { status: 200, data: wine }
})
```

## POST — Create

```ts
import { match } from 'ts-pattern'
import { WineId, WineColor } from '~/domain/wine/primitives'
import { WineCommand } from '~/domain/wine/command'
import type { Wine } from '~/domain/wine/types'
import { Eur, Year, Country } from '~/domain/shared/primitives'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate at boundary
  const wine: Wine = {
    id: WineId(crypto.randomUUID()),
    name: z.string().min(1).parse(body.name),
    color: WineColor(body.color),
    country: Country(body.country),
    year: Year(body.year),
    price: Eur(body.price),
    createdAt: new Date(),
  }

  const result = await WineCommand.create(wine)
  return match(result)
    .with({ outcome: 'created' }, ({ wine }) => ({ status: 201, data: wine }))
    .exhaustive()
})
```

## PUT — Update

```ts
export default defineEventHandler(async (event) => {
  const id = WineId(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const result = await WineCommand.update(id, {
    name: z.string().min(1).parse(body.name),
    price: Eur(body.price),
  })

  return match(result)
    .with({ outcome: 'updated' }, ({ wine }) => ({ status: 200, data: wine }))
    .with({ outcome: 'not-found' }, () => {
      throw createError({ statusCode: 404, statusMessage: 'Wine not found' })
    })
    .exhaustive()
})
```

## DELETE

```ts
export default defineEventHandler(async (event) => {
  const id = WineId(getRouterParam(event, 'id'))
  const result = await WineCommand.remove(id)

  return match(result)
    .with({ outcome: 'removed' }, () => ({ status: 200, data: null }))
    .with({ outcome: 'not-found' }, () => {
      throw createError({ statusCode: 404, statusMessage: 'Wine not found' })
    })
    .exhaustive()
})
```

## Key Rules

1. **Validate at the route boundary** — Use Zod/branded constructors on all input
2. **Never validate inside the domain** — Trust branded types
3. **Map outcomes to HTTP** — Use `match().exhaustive()` for all command results
4. **Consistent envelope** — Always `{ status, data }`
