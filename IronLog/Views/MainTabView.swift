import SwiftUI

struct MainTabView: View {
    @Environment(AppState.self) private var appState
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            LogHomeView()
                .tabItem { Label("Log", systemImage: "dumbbell.fill") }
                .tag(0)
            RecordsView()
                .tabItem { Label("Records", systemImage: "trophy.fill") }
                .tag(1)
            HistoryView()
                .tabItem { Label("History", systemImage: "calendar") }
                .tag(2)
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
                .tag(3)
        }
    }
}
