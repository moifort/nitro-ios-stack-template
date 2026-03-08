# Writing Your Project's README

Guide for projects created from this template. Your README is the first thing someone reads — it should answer "what is this, how do I install it, how do I run it" without requiring prior knowledge of the codebase.

## Principles

1. **Explain what things do, not how they're built.** "A server that stores your wine collection" — not "A Nitro-based DDD backend with file-based storage using unstorage"
2. **Name every file explicitly.** "Edit `.env`" — not "edit the environment file"
3. **Explain why before how.** "The API token protects your server so only your app can access it. To create one: ..." — not just "Set `NITRO_API_TOKEN` in `.env`"
4. **Number every step.** A reader should be able to follow the README top to bottom without jumping around
5. **No jargon unless the reader needs it.** Skip DDD, branded types, discriminated unions, architectural layers. These belong in `docs/`, not in the README
6. **Keep it in English.** Consistent with code, commit messages, and the rest of the documentation

## Structure

Follow this order. Skip a section only if it genuinely doesn't apply to your project.

### 1. Title + one-line description

The name of your project and one sentence that says what it does for the user.

```md
# WineCellar

Track your wine collection, know what to drink and when.
```

Not what it's built with. Not the architecture. What it does.

### 2. What the project does

A short list (3-6 bullet points) of what the project contains, from a user's perspective. Each bullet = one capability.

```md
## What's in the box

- A **backend server** that stores your wines and tracks their drinking windows
- An **iOS app** to browse your cellar, add bottles, and get notifications
- **Error monitoring** with Sentry so you know when something breaks (optional)
- A **Docker setup** for deploying the server at home or in the cloud
```

Rules:
- Lead with the user benefit, not the technology
- Put "(optional)" next to things that aren't required
- Don't list internal implementation details (migrations, middleware, plugins)

### 3. Prerequisites

A table with three columns: what to install, what it does, how to install it.

```md
## Prerequisites

| Tool | What it does | Install |
|------|-------------|---------|
| [Bun](https://bun.sh/) | Runs the backend server | `curl -fsSL https://bun.sh/install \| bash` |
| [Xcode](https://developer.apple.com/xcode/) | Builds the iOS app | Mac App Store |
| [Docker](https://www.docker.com/) | Deploys the server (optional) | [docker.com](https://www.docker.com/) |
```

Only list things the reader needs to install themselves. Don't list transitive dependencies (TypeScript, Swift packages — they're handled automatically).

### 4. Installation

Walk through every step from "I just cloned the repo" to "the project is ready". Reference `init.sh` if the project was created from the template (it won't exist after init — skip this section for already-initialized projects).

```md
## Installation

1. Clone the repo:

\```bash
git clone https://github.com/you/wine-cellar.git
cd wine-cellar
\```

2. Install dependencies:

\```bash
bun install
\```
```

If the project has no init script, list each manual step: install deps, create config files, etc.

### 5. Setting up keys

One subsection per key. Each subsection answers three questions:

1. **What it does** — one sentence, no jargon
2. **How to get it** — exact steps (create account, generate token, copy value)
3. **Where to put it** — table with file path + variable name

```md
### API token

**What it does:** protects your server so only your app can talk to it.

**How to create one:**

\```bash
openssl rand -hex 32
\```

**Where to put it:**

| File | Variable |
|------|----------|
| `.env` | `NITRO_API_TOKEN=your-token-here` |
| `ios/WineCellar/Shared/Secrets.swift` | `static let apiToken = "your-token-here"` |
```

Rules:
- Mark optional keys as optional
- If a key comes from an external service (Sentry, Stripe, etc.), link to that service and give the exact navigation path to find the value
- Show the actual file paths from your project, not generic ones
- If the same value goes in multiple files, say so explicitly

### 6. Running the project

Two subsections: backend + iOS. Each one should be copy-pasteable.

```md
## Running the project

### Start the backend

\```bash
bun run dev
\```

The server starts at `http://localhost:3000`.

### Run the iOS app

1. Open the Xcode project:

\```bash
open ios/WineCellar.xcodeproj
\```

2. Set your Development Team in Signing & Capabilities
3. Pick a simulator and hit Run
```

Include a way to verify it works (health endpoint, expected screen, etc.).

### 7. Deployment

How to build and deploy. Start with the simplest option (Docker), then alternatives (CasaOS, cloud).

```md
## Deployment

### Docker

\```bash
bun run build
docker build -t wine-cellar .
docker compose up -d
\```

Set `NITRO_API_TOKEN` and `NITRO_SENTRY_DSN` in the compose file or in a `.env` file.
```

Only document deployment options that are actually set up in the project. Don't document hypothetical "you could also deploy to..." options.

### 8. Documentation links

A table linking to the guides in `docs/`. One line per guide, with a plain-language description of what it covers.

```md
## Documentation

| Guide | What it covers |
|-------|---------------|
| [Architecture](docs/architecture.md) | How the backend is organized |
| [iOS Guide](docs/ios-guide.md) | How to add screens to the iOS app |
```

Describe what the reader will learn, not the technical content. "How to add screens to the iOS app" — not "SwiftUI feature structure with atomic design and MVVM ViewModels".

## Checklist

Before considering the README done:

- [ ] A developer who doesn't know the project can install and run it by following the README alone
- [ ] Every file path mentioned in the README actually exists in the project
- [ ] Every key/secret has: what it does, how to get it, where to put it
- [ ] No section assumes knowledge of the codebase internals
- [ ] No unexplained acronyms or framework-specific terms
- [ ] Code blocks are copy-pasteable (no placeholder that would fail if pasted as-is, except obvious ones like `your-token-here`)
