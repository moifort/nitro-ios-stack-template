# Error Handling

## Principle

We use **discriminated unions** instead of exceptions for domain-level errors. Exceptions are reserved for truly unexpected failures.

This implements Wlashin's **Railway-Oriented Programming**: each function returns a discriminated union where every possible outcome is an explicit track. The caller must handle all tracks via `match().exhaustive()`, making error handling visible and compiler-enforced.

## Result Type Philosophy

Result types are **rare and business-oriented**. Use them only when the domain has multiple legitimate outcomes the caller must handle (e.g. "wine not found" on delete). Most queries simply return the data or `null`.

**Outcomes are simple strings** — `'not-found'`, `'removed'`, `'created'`. Never error objects, never nested structures. When data is returned alongside the outcome, it's the domain type directly:

```ts
return { outcome: 'created' as const, wine }  // wine is a Wine
return { outcome: 'not-found' as const }       // no payload needed
```

## Pattern

### Domain Commands Return Discriminated Unions

```ts
export namespace WineCommand {
  export const remove = async (id: WineId) => {
    const existing = await WineRepository.findById(id)
    if (!existing) return { outcome: 'not-found' as const }
    await WineRepository.remove(id)
    return { outcome: 'removed' as const }
  }
}
```

Key points:
- Always use `as const` on literal return values for type narrowing
- Each outcome is a distinct discriminant
- No exceptions thrown for expected failures

### Route Handlers Map Outcomes to HTTP

```ts
import { match } from 'ts-pattern'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const id = WineId(body.id)

  const result = await WineCommand.remove(id)
  return match(result)
    .with({ outcome: 'removed' }, () => ({ status: 200, data: null }))
    .with({ outcome: 'not-found' }, () => {
      throw createError({ statusCode: 404, statusMessage: 'Wine not found' })
    })
    .exhaustive()
})
```

### Always Use `match().exhaustive()`

**Never use `switch`** — use `match()` from `ts-pattern` with `.exhaustive()`. This ensures all outcomes are handled at compile time.

> **Wlashin:** totality — every possible case must be handled. The compiler guarantees no outcome is silently ignored.

```ts
// Bad
switch (result.outcome) {
  case 'created': return ...
  case 'not-found': return ...
}

// Good
match(result)
  .with({ outcome: 'created' }, ({ wine }) => ({ status: 201, data: wine }))
  .with({ outcome: 'not-found' }, () => {
    throw createError({ statusCode: 404 })
  })
  .exhaustive()
```

## Error Handling Levels

1. **Domain layer** — Returns discriminated unions for expected business outcomes (no try/catch). Throws for impossible states (data that should exist but doesn't). Wlashin: errors are data, not control flow — they are returned as values, not thrown as exceptions.
2. **Route layer** — Maps outcomes to HTTP status codes via `match().exhaustive()`
3. **Plugin layer** — Catches unexpected errors (Sentry, migration runner)

## Throw for Impossible States

If a piece of data should exist (referenced by another domain, result of a previous flow) and it doesn't — that's a bug, an incoherent state. **Throw immediately**, don't return a Result.

The framework (Nitro/Sentry) catches it automatically → 500 + alert. The process cannot continue because the application is in an invalid state.

```ts
// Bad — treating an impossible state as a business outcome
const tasting = await TastingQuery.getById(tastingId)
if (!tasting) return { outcome: 'not-found' as const }

// Good — this tasting was just referenced, it must exist
const tasting = await TastingQuery.getById(tastingId)
if (!tasting) throw new Error(`Tasting ${tastingId} not found — incoherent state`)
```

**Rule of thumb:** if the caller can't meaningfully recover from the absence, it's an impossible state → throw. If the absence is a normal business scenario the user triggered (e.g. deleting a wine that may not exist) → return a Result.

## Zod Validation Errors

Zod throws on invalid input. This happens at the route boundary (the validation entry point). Nitro automatically converts these to 400 errors.
