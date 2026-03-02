import Sentry
import SwiftUI

@main
struct MyAppApp: App {
    init() {
        UserDefaults.standard.register(defaults: [APIClient.serverURLKey: APIClient.defaultURL])
        startSentry()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }

    private func startSentry() {
        let dsn = Secrets.sentryDsn
        if dsn.isEmpty { return }

        SentrySDK.start { options in
            options.dsn = dsn
            options.tracesSampleRate = 1.0
            options.enableAutoSessionTracking = true
            options.enableTimeToFullDisplayTracing = true
            options.tracePropagationTargets = []
        }
    }
}
