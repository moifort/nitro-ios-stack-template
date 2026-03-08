# iOS Development Guide

## Tech Stack

- **SwiftUI** with iOS 26.0 deployment target
- **Swift 6** with strict concurrency
- **Sentry** for crash reporting and performance monitoring
- **Settings.bundle** for server URL configuration

## Project Structure

```
ios/MyApp/
├── MyAppApp.swift          # Entry point + Sentry init
├── ContentView.swift       # Root view
├── Assets.xcassets/        # App icon, accent color
├── Settings.bundle/        # Settings app preferences
├── Shared/
│   ├── APIClient.swift     # HTTP client (generic, Bearer auth)
│   ├── ErrorReporting.swift # Sentry error reporting
│   ├── Secrets.swift       # API tokens (gitignored)
│   └── Components/         # Cross-feature reusable atoms
│       ├── ColorBadge.swift
│       ├── StarRatingView.swift
│       └── LabeledInfoRow.swift
└── Features/               # Feature modules
    └── {Feature}/
        ├── {Feature}Models.swift      # API/DTO structs
        ├── {Feature}ViewModel.swift   # ViewModel
        └── components/
            ├── pages/                 # Coordinators (loading, sheets, navigation)
            ├── organisms/             # Composite sections, forms, content views
            └── molecules/             # Small composed views (rows, badges)
```

## Feature Pattern

### ViewModel

```swift
import SwiftUI

@MainActor @Observable
final class WineListViewModel {
    private(set) var wines: [Wine] = []
    private(set) var isLoading = false
    private(set) var errorMessage: String?

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let response: APIResponse<[Wine]> = try await APIClient.shared.get("/wines")
            wines = response.data
        } catch {
            errorMessage = reportError(error)
        }
    }
}
```

Key conventions:
- `@MainActor` on all ViewModels
- `@Observable` (not `ObservableObject`)
- `private(set)` for published state
- Error reporting via `reportError()` (Sentry)

### Page View

```swift
struct WineListPage: View {
    @State private var viewModel = WineListViewModel()

    var body: some View {
        NavigationStack {
            List(viewModel.wines) { wine in
                WineRow(name: wine.name, color: wine.color)
            }
            .navigationTitle("Wines")
            .task { await viewModel.load() }
        }
    }
}
```

### Primitive-First Views

Leaf views (atoms, molecules) receive only primitive types — never domain structs:

```swift
// Good — takes only what it displays
struct WineRow: View {
    let name: String
    let color: WineColor  // simple enum without logic = tolerated
    let vintage: Int?

    var body: some View {
        HStack {
            ColorBadge(color: color)
            Text(name)
        }
    }
}

// Bad — takes full model (22 fields, only 3 used)
struct WineRow: View {
    let wine: Wine  // Don't do this
}
```

**Allowed types in leaf views:**
- `String`, `Int`, `Int?`, `Double?`, `Bool`, `Date?`
- Simple enums without logic (like `WineColor` — equivalent to a typed String)
- Closures (`() -> Void`, `(String) -> Void`)
- **Never** domain structs (`Wine`, `UserDetail`, `CellarBottle`)

### Item Pattern (5+ Parameters)

When a component needs more than ~5 parameters, define a nested `Item` struct:

```swift
struct WineListContent: View {
    let items: [Item]

    var body: some View {
        List(items) { item in
            WineRow(name: item.name, color: item.color, vintage: item.vintage)
        }
    }
}

extension WineListContent {
    struct Item: Identifiable {
        let id: String
        let name: String
        let color: WineColor
        let vintage: Int?
        let isFavorite: Bool
    }
}
```

The mapping from domain models to `Item` happens at the **page level** (coordinator):

```swift
struct WineListPage: View {
    @State private var viewModel = WineListViewModel()

    var body: some View {
        WineListContent(
            items: viewModel.wines.map { wine in
                .init(id: wine.id, name: wine.name, color: wine.color,
                      vintage: wine.vintage, isFavorite: wine.rating == 5)
            }
        )
    }
}
```

### Atomic Design Layers

| Layer | Location | Receives | Examples |
|-------|----------|----------|----------|
| **Atoms** | `Shared/Components/` | Primitives | `ColorBadge`, `StarRatingView`, `PositionBadge` |
| **Molecules** | `Features/{F}/components/molecules/` | Primitives | `WineRow`, `BottleRow`, `LabeledInfoRow` |
| **Organisms** | `Features/{F}/components/organisms/` | Primitives or `Item` struct | `WineListContent`, `EditForm`, `DetailContent` |
| **Pages** | `Features/{F}/components/pages/` | ViewModel | `WineListPage`, `DetailSheet` |

**Atoms** in `Shared/Components/` are cross-feature. A molecule that is used in 2+ features should be promoted to `Shared/Components/`.

### Page = Coordinator

Pages handle loading, error states, sheets, navigation, and toolbar. They map domain models to primitives for child components. They are the only layer allowed to call APIs and hold `@State` for sheet presentation.

```swift
struct DetailSheet: View {
    let itemId: String
    @State private var detail: ItemDetail?
    @State private var isEditing = false

    var body: some View {
        NavigationStack {
            if let detail {
                if isEditing {
                    EditForm(initial: editFields(from: detail), onSave: { ... }, onCancel: { ... })
                } else {
                    DetailContent(detail: detail, onRemoveRequested: { ... })
                }
            }
        }
    }
}
```

### Organisms as Mapping Boundaries

An organism like `DetailContent` can accept a domain struct when it's the **mapping boundary** — the point where the domain model is broken down into primitives for child sections:

```swift
struct DetailContent: View {
    let detail: ItemDetail          // OK at organism level
    var onRemoveRequested: () -> Void = {}

    var body: some View {
        List {
            HeaderSection(name: detail.name, color: detail.color)    // primitives
            OriginSection(region: detail.region, country: detail.country)  // primitives
        }
    }
}
```

The key: child sections within the organism only receive primitives.

### Edit Form Pattern

Extract edit forms into standalone organisms with a `Fields` struct:

```swift
struct EditForm: View {
    let initial: Fields
    let onSave: (UpdateRequest) async throws -> Void
    let onCancel: () -> Void

    @State private var name: String
    // ... @State for each field, initialized from `initial` via State(initialValue:)

    struct Fields {
        var name: String
        var color: WineColor
        // ... all primitive values
    }
}
```

Benefits: previewable in isolation, testable independently, parent page stays lean.

### Previews as Storybook

Every component below the page level **must** be previewable without a running server:

```swift
// Good — preview with inline data
#Preview("En cave") {
    DetailContent(
        detail: ItemDetail(id: "1", name: "Margaux", ...),
        onRemoveRequested: {}
    )
}

// Bad — preview that calls the API
#Preview {
    DetailSheet(itemId: "c2f5486a-...")  // needs a server
}
```

Pages (coordinators) are the exception — they load data from APIs. But their child organisms/molecules must all be previewable with mock data.

## APIClient

Generic HTTP client with Bearer token authentication:

```swift
// GET
let response: APIResponse<[Wine]> = try await APIClient.shared.get("/wines")

// POST
let response: APIResponse<Wine> = try await APIClient.shared.post("/wines", body: newWine)

// PUT
let response: APIResponse<Wine> = try await APIClient.shared.put("/wines/\(id)", body: updated)

// DELETE
try await APIClient.shared.delete("/wines/\(id)")
```

## Model Types

```swift
struct Wine: Codable, Sendable, Identifiable {
    let id: String
    let name: String
    let color: String
    let country: String
    let year: Int
    let price: Double
    let createdAt: Date
}

struct APIResponse<T: Decodable>: Decodable {
    let status: Int
    let data: T
}
```

Model types must be `Sendable` (Swift 6 requirement).

## UI Testing

Page Object pattern:

```swift
// Pages/WineListPage.swift
@MainActor
struct WineListPageObject {
    let app: XCUIApplication

    var wineList: XCUIElement { app.collectionViews.firstMatch }

    func tapWine(named name: String) throws {
        try app.staticTexts[name].tapOrFail()
    }
}

// Tests/WineListTests.swift
final class WineListTests: BaseUITest {
    func testShowsWines() throws {
        try api.createWine(["name": "Margaux", "color": "red", ...])
        let page = WineListPageObject(app: app)
        try page.wineList.waitOrFail()
    }
}
```

## Secrets Setup

Copy the example and fill in your values:

```bash
cp ios/MyApp/Shared/Secrets.swift.example ios/MyApp/Shared/Secrets.swift
cp ios/MyAppUITests/Support/TestSecrets.swift.example ios/MyAppUITests/Support/TestSecrets.swift
```
