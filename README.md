# nitro-ios-stack-template

A GitHub template for full-stack apps with a **Nitro/TypeScript DDD backend** and **SwiftUI iOS frontend**.

## Tech Stack

**Backend:**
- [Nitro](https://nitro.build/) 2.12 — TypeScript server framework
- [Zod](https://zod.dev/) 4 — Runtime validation
- [ts-brand](https://github.com/nicklasw/ts-brand) — Nominal/branded types
- [ts-pattern](https://github.com/gvergnaud/ts-pattern) — Exhaustive pattern matching
- [Sentry](https://sentry.io/) — Error tracking & performance monitoring
- File-based storage (fs driver)

**iOS:**
- SwiftUI — iOS 26.0+
- Swift 6 — Strict concurrency
- Sentry — Crash reporting

**Infrastructure:**
- [Bun](https://bun.sh/) — Runtime & package manager
- Docker — Production deployment
- GitHub Actions — CI/CD (Docker publish, Sentry autofix)

## Quick Start

### 1. Use this template

Click **"Use this template"** on GitHub, or clone and run `init.sh`:

```bash
git clone https://github.com/YOUR_USERNAME/nitro-ios-stack-template.git my-project
cd my-project
./init.sh
```

The init script will:
- Rename all `MyApp` references to your project name
- Create secret files from templates
- Install dependencies
- Initialize git

### 2. Start the backend

```bash
bun run dev
```

### 3. Open the iOS project

```bash
open ios/MyApp.xcodeproj
```

Set your development team in Xcode, then build and run.

## Project Structure

```
├── server/
│   ├── domain/        # Business logic (DDD bounded contexts)
│   ├── routes/        # HTTP endpoints
│   ├── middleware/     # Auth
│   ├── plugins/       # Sentry, migration, cache
│   └── system/        # Config, migration, Sentry instrumentation
├── ios/
│   ├── MyApp/         # SwiftUI app
│   └── MyAppUITests/  # UI tests (Page Object pattern)
├── docs/              # Architecture & pattern guides
└── CLAUDE.md          # AI coding assistant directives
```

## Documentation

| Guide | Description |
|-------|-------------|
| [Architecture](docs/architecture.md) | Backend DDD layers, data flow, cross-domain rules |
| [Domain Guide](docs/domain-guide.md) | Step-by-step: adding a new domain |
| [Branded Types](docs/branded-types.md) | ts-brand + Zod validation pattern |
| [Error Handling](docs/error-handling.md) | Discriminated unions, match().exhaustive() |
| [Migrations](docs/migrations.md) | Migration system guide |
| [iOS Guide](docs/ios-guide.md) | Feature structure, ViewModel, APIClient |
| [API Patterns](docs/api-patterns.md) | Route handler patterns (GET/POST/PUT/DELETE) |
| [Code Style](docs/code-style.md) | All coding rules with before/after examples |

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NITRO_API_TOKEN` | Bearer token for API authentication (optional) |
| `NITRO_SENTRY_DSN` | Sentry DSN for error tracking (optional) |

### iOS Secrets

```bash
cp ios/MyApp/Shared/Secrets.swift.example ios/MyApp/Shared/Secrets.swift
cp ios/MyAppUITests/Support/TestSecrets.swift.example ios/MyAppUITests/Support/TestSecrets.swift
```

## Deployment

### Docker

```bash
bun run build
docker build -t my-app .
docker run -p 3000:3000 -e NITRO_API_TOKEN=secret my-app
```

Or use `docker-compose.yml`:

```bash
docker compose up -d
```

### CasaOS

[CasaOS](https://casaos.io/) is a home server OS that deploys apps via docker-compose with `x-casaos` metadata.

A ready-to-use compose file is provided in `docker-compose.casaos.yml`. To deploy:

1. Copy `docker-compose.casaos.yml` to your CasaOS instance
2. Update the `image` field with your Docker image (e.g. `ghcr.io/your-org/your-app:latest`)
3. Set `NITRO_API_TOKEN` and `NITRO_SENTRY_DSN` environment variables
4. Update the `x-casaos` block (title, icon, author) to match your project
5. Import the file in CasaOS or place it in the app store directory
