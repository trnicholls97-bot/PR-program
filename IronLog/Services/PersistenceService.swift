import Foundation

class PersistenceService {
    private let key = "ironlog_v1_ios"

    // Codable snapshot of the persisted portions of AppState
    private struct Snapshot: Codable {
        var profile: UserProfile
        var workoutHistory: [CompletedWorkout]
        var personalRecords: [String: PersonalRecord]
        var cardioPRs: [String: CardioPR]
        var dayPlans: [String: [String]]
        var customDays: [CustomDayDefinition]
        var customExercises: [Exercise]
        var exerciseOverrides: [String: ExerciseOverride]
        var exerciseNameOverrides: [String: String]
        var dayIconOverrides: [String: String]
        var warmupEnabled: Bool
        var warmupDefaultCount: Int
        var themeMode: ThemeMode
        var accentHex: String
    }

    func save(_ state: AppState) {
        let snapshot = Snapshot(
            profile: state.profile,
            workoutHistory: state.workoutHistory,
            personalRecords: state.personalRecords,
            cardioPRs: state.cardioPRs,
            dayPlans: state.dayPlans,
            customDays: state.customDays,
            customExercises: state.customExercises,
            exerciseOverrides: state.exerciseOverrides,
            exerciseNameOverrides: state.exerciseNameOverrides,
            dayIconOverrides: state.dayIconOverrides,
            warmupEnabled: state.warmupEnabled,
            warmupDefaultCount: state.warmupDefaultCount,
            themeMode: state.themeMode,
            accentHex: state.accentHex
        )
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        UserDefaults.standard.set(data, forKey: key)
    }

    func load(into state: AppState) {
        guard let data = UserDefaults.standard.data(forKey: key),
              let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data) else { return }
        state.profile = snapshot.profile
        state.workoutHistory = snapshot.workoutHistory
        state.personalRecords = snapshot.personalRecords
        state.cardioPRs = snapshot.cardioPRs
        state.dayPlans = snapshot.dayPlans.isEmpty ? DataService.defaultDayPlans : snapshot.dayPlans
        state.customDays = snapshot.customDays
        state.customExercises = snapshot.customExercises
        state.exerciseOverrides = snapshot.exerciseOverrides
        state.exerciseNameOverrides = snapshot.exerciseNameOverrides
        state.dayIconOverrides = snapshot.dayIconOverrides
        state.warmupEnabled = snapshot.warmupEnabled
        state.warmupDefaultCount = snapshot.warmupDefaultCount
        state.themeMode = snapshot.themeMode
        state.accentHex = snapshot.accentHex
    }
}
