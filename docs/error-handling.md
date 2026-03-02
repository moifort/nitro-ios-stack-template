# Error Handling

## Principle

We use **discriminated unions** instead of exceptions for domain-level errors. Exceptions are reserved for truly unexpected failures.

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

**Never use `switch`** — use `match()` from `ts-pattern` with `.exhaustive()`. This ensures all outcomes are handled at compile time:

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

1. **Domain layer** — Returns discriminated unions (no try/catch)
2. **Route layer** — Maps outcomes to HTTP status codes via `match().exhaustive()`
3. **Plugin layer** — Catches unexpected errors (Sentry, migration runner)

## Zod Validation Errors

Zod throws on invalid input. This happens at the route boundary (the validation entry point). Nitro automatically converts these to 400 errors.
