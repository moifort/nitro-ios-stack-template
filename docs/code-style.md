# Code Style Guide

Many of these rules implement DDD principles from Evans (*Domain-Driven Design*) and functional modeling principles from Wlashin (*Domain Modeling Made Functional*).

## Formatter

Biome with:
- Spaces (2), single quotes, no semicolons
- Line width: 100

Run: `bunx biome check --write`

## TypeScript Rules

### Never type return values

Let TypeScript infer:

```ts
// Bad
export const getAll = async (): Promise<Wine[]> => { ... }

// Good
export const getAll = async () => { ... }
```

### Full variable names

> **Evans:** Ubiquitous Language — code reads like the domain language. `migration` says what it is; `m` says nothing.

```ts
// Bad
migrations.filter((m) => m.version > meta.version)

// Good
migrations.filter((migration) => migration.version > meta.version)
```

### Destructure in callbacks

```ts
// Bad
sortBy(migrations, (m) => m.version)

// Good
sortBy(migrations, ({ version }) => version)
```

### Inline single-line guards

```ts
// Bad
if (!existing) {
  return { outcome: 'not-found' as const }
}

// Good
if (!existing) return { outcome: 'not-found' as const }
```

### `as const` on all literal returns

```ts
// Bad
return { outcome: 'created' }

// Good
return { outcome: 'created' as const }
```

### Use `Date` type, not `string`

```ts
// Bad
type Wine = { createdAt: string }

// Good
type Wine = { createdAt: Date }
```

### Error handling at caller level

```ts
// Bad — try/catch in each unit
export const migrate = async () => {
  try { ... } catch (e) { ... }
}

// Good — try/catch in runner/orchestrator
for (const migration of pending) {
  try {
    const result = await migration.migrate(ctx)
  } catch (error) { ... }
}
```

### Use lodash-es

```ts
import { sortBy, keyBy, uniq, orderBy } from 'lodash-es'

// Prefer keyBy over new Set + map
const byId = keyBy(wines, ({ id }) => id)

// Prefer uniq over new Set
const colors = uniq(wines.map(({ color }) => color))
```

### All union types validated in `primitives.ts`

> **Wlashin:** making illegal states unrepresentable — every union value is validated through a Zod constructor, so invalid variants cannot exist at runtime.

```ts
// Bad
const color = body.color as WineColor

// Good
const color = WineColor(body.color)
```

### Never `switch` — use `match().exhaustive()`

> **Wlashin:** totality — `.exhaustive()` forces every case to be handled. Adding a new variant becomes a compile error, not a silent bug.

```ts
import { match } from 'ts-pattern'

// Bad
switch (result.outcome) { ... }

// Good
match(result)
  .with({ outcome: 'created' }, ...)
  .with({ outcome: 'not-found' }, ...)
  .exhaustive()
```

### Never `for`/`while` loops — use functional style

> **Wlashin:** functional composition — `map`/`filter`/`reduce` express intent declaratively. Each transformation is a self-contained step in a pipeline. Chaining and lodash-es utilities improve readability over imperative loops.

```ts
// Bad
for (const wine of wines) { ... }
while (condition) { ... }

// Good
wines.map((wine) => ...)
wines.filter((wine) => ...)
sortBy(wines, ({ year }) => year)
```

### Arrays never optional

> **Wlashin:** every value of the type is valid — `[]` is a perfectly valid array. Optional arrays create two representations of "empty" (`undefined` vs `[]`), which is an illegal state.

```ts
// Bad
type Wine = { tags?: string[] }

// Good
type Wine = { tags: string[] }  // [] is the neutral state
```

This applies to both backend TypeScript and iOS Swift.

## Swift Rules

- `@MainActor` on all ViewModels
- `Sendable` on all model types
- Components take primitives, not full domain objects
- `@Observable` (not `ObservableObject`)
