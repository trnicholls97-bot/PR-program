import SwiftUI

@main
struct IronLogApp: App {
    @State private var appState = AppState()
    @State private var sessionVM = WorkoutSessionViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
                .environment(sessionVM)
                .preferredColorScheme(appState.themeMode == .dark ? .dark : .light)
        }
    }
}
