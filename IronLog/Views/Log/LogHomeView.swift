import SwiftUI

struct LogHomeView: View {
    @Environment(AppState.self) private var appState
    @Environment(WorkoutSessionViewModel.self) private var sessionVM
    @State private var navigateToWorkout = false

    private let columns = [GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        NavigationStack {
            Group {
                if sessionVM.session != nil {
                    ActiveWorkoutView()
                } else {
                    dayGrid
                }
            }
            .navigationTitle("IronLog")
            .navigationBarTitleDisplayMode(.large)
        }
    }

    // MARK: - Day grid

    private var dayGrid: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 16) {
                // Built-in days
                ForEach(DataService.dayDefinitions) { day in
                    DayCardButton(
                        icon: appState.dayIconOverrides[day.id] ?? day.icon,
                        label: day.label,
                        exerciseCount: appState.dayPlans[day.id]?.count ?? 0
                    ) {
                        sessionVM.startSession(dayId: day.id, dayLabel: day.label)
                    }
                }
                // Custom days
                ForEach(appState.customDays) { custom in
                    DayCardButton(
                        icon: custom.icon,
                        label: custom.name,
                        exerciseCount: appState.dayPlans[custom.id.uuidString]?.count ?? 0
                    ) {
                        sessionVM.startSession(dayId: custom.id.uuidString, dayLabel: custom.name)
                    }
                }
            }
            .padding()
        }
        .background(Color(.systemBackground))
    }
}

// MARK: - Day card button

private struct DayCardButton: View {
    let icon: String
    let label: String
    let exerciseCount: Int
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 10) {
                Text(icon)
                    .font(.system(size: 48))
                Text(label)
                    .font(.headline)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.primary)
                Text("\(exerciseCount) exercise\(exerciseCount == 1 ? "" : "s")")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, minHeight: 140)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(.secondarySystemBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .strokeBorder(Color(.separator), lineWidth: 0.5)
            )
        }
        .buttonStyle(.plain)
    }
}
