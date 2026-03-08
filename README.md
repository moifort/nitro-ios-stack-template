# nitro-ios-stack-template

A ready-to-use template to create a full-stack app: a backend server + an iOS app.

## What's in the box

- A **TypeScript backend** powered by [Nitro](https://nitro.build/) (HTTP server + file-based storage)
- An **iOS app** in SwiftUI (iOS 26+, Swift 6)
- A **data migration system** that runs automatically on server start
- **Error monitoring** with [Sentry](https://sentry.io/) (optional — works without it)
- A **Docker setup** ready for production deployment

## Prerequisites

| Tool | What it does | Install |
|------|-------------|---------|
| [Bun](https://bun.sh/) | Runs the backend server and manages dependencies | `curl -fsSL https://bun.sh/install \| bash` |
| [Xcode](https://developer.apple.com/xcode/) | Builds and runs the iOS app | Mac App Store |
| [Docker](https://www.docker.com/) | Deploys the server in production (optional) | [docker.com](https://www.docker.com/) |

## Installation

1. **Create your repository** from this template on GitHub (click "Use this template"), then clone it:

```bash
git clone https://github.com/YOUR_USERNAME/your-project.git
cd your-project
```

2. **Run the init script:**

```bash
./init.sh
```

The script asks you two things:
- A **project name** in PascalCase (e.g. `WineCellar`, `BookTracker`)
- A **bundle ID prefix** (e.g. `com.yourcompany`) — press Enter to use `com.example`

Then it takes care of everything: renames all files, installs dependencies, and creates a first git commit. Your project is ready.

## Setting up keys

Both keys below are **optional**. The app works without them — you can set them up later.

### API token

**What it does:** protects your server so only your iOS app can access it. Think of it as a password between your app and your server.

**How to create one:** generate a random string. Run this in your terminal:

```bash
openssl rand -hex 32
```

**Where to put it** (same value in both files):

| File | Variable |
|------|----------|
| `.env` | `NITRO_API_TOKEN=your-token-here` |
| `ios/YourApp/Shared/Secrets.swift` | `static let apiToken = "your-token-here"` |

### Sentry DSN

**What it does:** sends your app's errors to [Sentry](https://sentry.io/) so you can see crashes and bugs in real time, without needing users to report them.

**How to get one:**
1. Create a free account on [sentry.io](https://sentry.io/)
2. Create a new project (choose "Bun" for the backend, "iOS" for the app)
3. Copy the **DSN** (it looks like `https://abc123@o456.ingest.sentry.io/789`)

**Where to put it:**

| File | Variable |
|------|----------|
| `.env` | `NITRO_SENTRY_DSN=your-dsn-here` |
| `ios/YourApp/Shared/Secrets.swift` | `static let sentryDsn = "your-dsn-here"` |

## Running the project

### Start the backend

```bash
bun run dev
```

The server starts at `http://localhost:3000`. Check it's running by opening `http://localhost:3000/health` in your browser.

### Run the iOS app

1. Open the Xcode project:

```bash
open ios/YourApp.xcodeproj
```

2. Set your **Development Team** in Xcode (Signing & Capabilities)
3. Pick a simulator and hit **Run**

The app connects to `localhost:3000` by default, which works out of the box with the iOS simulator.

## Deployment

### Build the Docker image

```bash
bun run build
docker build -t your-app .
```

### Run with Docker Compose

```bash
docker compose up -d
```

The `docker-compose.yml` file mounts a `./data` volume for persistent storage and exposes port 3000. Set your environment variables (`NITRO_API_TOKEN`, `NITRO_SENTRY_DSN`) in the compose file or via an `.env` file.

### CasaOS (home server)

A [CasaOS](https://casaos.io/)-compatible compose file is provided in `docker-compose.casaos.yml`. To use it:

1. Update the `image` field with your Docker image (e.g. `ghcr.io/your-org/your-app:latest`)
2. Set your environment variables
3. Update the `x-casaos` metadata (title, icon, author)
4. Import the file in CasaOS

## Documentation

The `docs/` folder contains detailed guides for going further:

| Guide | What it covers |
|-------|---------------|
| [Architecture](docs/architecture.md) | How the backend is organized, data flow between layers |
| [Domain Guide](docs/domain-guide.md) | Step-by-step: adding a new feature to the backend |
| [iOS Guide](docs/ios-guide.md) | How the iOS app is structured, adding new screens |
| [API Patterns](docs/api-patterns.md) | Writing API endpoints (GET, POST, PUT, DELETE) |
| [Migrations](docs/migrations.md) | Adding data migrations |
| [Error Handling](docs/error-handling.md) | How errors are managed across the stack |
| [Code Style](docs/code-style.md) | Coding rules and conventions |
| [Branded Types](docs/branded-types.md) | Type safety patterns for IDs and values |
| [README Guide](docs/readme-guide.md) | How to write your project's README |
