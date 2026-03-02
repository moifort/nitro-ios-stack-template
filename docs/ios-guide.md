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
│   └── Secrets.swift       # API tokens (gitignored)
└── Features/               # Feature modules
    └── {Feature}/
        ├── {Feature}Page.swift        # Main view
        ├── {Feature}ViewModel.swift   # ViewModel
        └── Components/               # Feature-specific views
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

### Components Take Primitives

Components receive only the values they need, never full domain objects:

```swift
// Good — takes only what it displays
struct WineRow: View {
    let name: String
    let color: String

    var body: some View {
        HStack {
            Text(name)
            Text(color)
        }
    }
}

// Bad — takes full model
struct WineRow: View {
    let wine: Wine  // Don't do this
}
```

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
