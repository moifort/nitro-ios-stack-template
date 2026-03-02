# Branded Types + Zod

## Overview

We use [ts-brand](https://github.com/nicklasw/ts-brand) to create nominal types that prevent accidental mixing of semantically different values (e.g., `WineId` vs `CellarId`), combined with [Zod](https://zod.dev/) for runtime validation.

## Pattern

### 1. Define the branded type (`types.ts`)

```ts
import type { Brand } from 'ts-brand'

export type WineId = Brand<string, 'WineId'>
export type Eur = Brand<number, 'Eur'>
```

### 2. Create the Zod constructor (`primitives.ts`)

```ts
import { make } from 'ts-brand'
import { z } from 'zod'
import type { WineId as WineIdType } from '~/domain/wine/types'

export const WineId = (value: unknown) => {
  const v = z.string().uuid().parse(value)
  return make<WineIdType>()(v)
}
```

### 3. Use at domain boundaries

```ts
// In a route handler — validation happens here
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const id = WineId(body.id)        // validates + brands
  const price = Eur(body.price)     // validates + brands
  // id is now WineId, not string
})
```

## Union Types

Union types (string literal unions) are also validated in `primitives.ts`:

```ts
// types.ts
export type WineColor = 'red' | 'white' | 'rose'

// primitives.ts
export const wineColors = ['red', 'white', 'rose'] as const

export const WineColor = (value: unknown) =>
  z.enum(wineColors).parse(value) as WineColor
```

**Never use `as MyType`** — always go through the Zod constructor.

## Numeric Types with String Coercion

For values that may arrive as strings (query params, storage):

```ts
export const Year = (value: unknown) => {
  const v = z
    .preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number().int().min(1800))
    .parse(value)
  return make<YearType>()(v)
}
```

## Shared Types

Common types live in `server/domain/shared/`:
- `Eur` — Euro amount (non-negative number)
- `Year` — Year (integer >= 1800)
- `Country` — Country name (non-empty string)
- `Count` — Count (number)
