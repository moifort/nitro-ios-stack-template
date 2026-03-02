import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationStack {
            Text("Hello, World!")
                .navigationTitle("MyApp")
        }
    }
}

#Preview {
    ContentView()
}
