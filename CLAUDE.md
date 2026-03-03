# Project Directives

## Build & Verification Commands

- **Backend typecheck**: `bun tsc --noEmit`
- **Regenerate types** (if routes changed): `bunx nitro prepare` (run before `bun tsc`)
- **iOS build**:
  ```
  DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project ios/MyApp.xcodeproj -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.2' build
  ```
- **Linter**: `bunx biome check`
- **Runtime**: always use `bun`/`bunx`, never `npm`/`npx`

## Development Workflow

1. Always verify the build before committing (backend `bun tsc --noEmit` + `xcodebuild` depending on what was touched)
2. Run `bunx nitro prepare` before `bun tsc` if routes were added/modified
3. Run `bunx biome check --write` to auto-fix formatting

## Backend Patterns (TypeScript/Nitro)

- Domain architecture: `server/domain/{domain}/types.ts`, `primitives.ts`, `repository.ts`, `command.ts`, `query.ts`
- Branded types with `ts-brand` + Zod validation constructors in `primitives.ts`
- Discriminated unions for errors (no exceptions)
- File-based storage: `useStorage('namespace')`
- Formatter: Biome (spaces, single quotes, no semicolons, line width 100)
- Logging: `createLogger(tag)` from `~/system/logger` — never use raw `console.log/error`

See [docs/architecture.md](docs/architecture.md) for full architecture overview.
See [docs/domain-guide.md](docs/domain-guide.md) for step-by-step domain creation.

## Database Migrations

- Location: `server/system/migration/`
- Forward-only sequential migrations, no rollback
- Meta tracked in `useStorage('migration-meta')` (key `state`)
- Nitro plugin (`server/plugins/migration.ts`) runs migrations at boot, `process.exit(1)` on failure
- To add a migration: create `server/system/migration/migrations/NNNN-name.ts`, register in `migrations/index.ts`

See [docs/migrations.md](docs/migrations.md) for full guide.

## iOS Patterns (SwiftUI)

- Target: iOS 26.0, Swift 6 (strict concurrency)
- `@MainActor` on ViewModels, `Sendable` on model types
- Feature structure: `ios/MyApp/Features/{Feature}/`
- Xcode uses `fileSystemSynchronizedGroups` (no need to manually add files)
- `DEVELOPER_DIR` required because `xcode-select` may point to CommandLineTools

See [docs/ios-guide.md](docs/ios-guide.md) for full iOS guide.

## Code Style

- **Never type return values** — let TypeScript infer
- **Full variable names** — `migration` not `m`
- **Destructure in callbacks** — `({ version }) => version`
- **Inline single-line guards** — `if (...) return ...` on one line
- **`as const` on all literal returns**
- **Use `Date` type** — not `string` for dates
- **Use lodash-es** — `sortBy`, `keyBy`, `uniq` with destructured callbacks
- **Never `switch`** — use `match()` from `ts-pattern` with `.exhaustive()`
- **Never `for` loops** — use `map`/`filter`/`reduce` or lodash
- **Arrays never optional** — `[]` is the neutral state, never `null`/`undefined`/`nil`

See [docs/code-style.md](docs/code-style.md) for full rules with examples.

## API Token

The API token is used for authentication when `NITRO_API_TOKEN` is set. To rotate the token, update it in:
- `.env` (`NITRO_API_TOKEN=...`)
- `ios/MyApp/Shared/Secrets.swift` (gitignored)
- `ios/MyAppUITests/Support/TestSecrets.swift` (gitignored)

See `.example` files next to the Secrets files for the expected format.
