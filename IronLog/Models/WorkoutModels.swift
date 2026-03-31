import Foundation

// MARK: - Active workout session (in-progress, not persisted long-term)
struct WorkoutSession: Identifiable, Codable {
    var id: UUID = UUID()
    var dayId: String
    var dayLabel: String
    var startTime: Date
    var exercises: [SessionExercise] = []
}

// MARK: - An exercise within an active session
struct SessionExercise: Identifiable, Codable {
    var id: UUID = UUID()
    var name: String
    var muscle: String
    var targetSets: String
    var targetReps: String
    var targetWeight: Double
    var variation: String? = nil
    var isCardio: Bool = false
    var sets: [WorkoutSet] = []
    var hasLoggedFirstSet: Bool = false
    var isExpanded: Bool = true
    var met: Double = 4.5
}

// MARK: - A single logged set
struct WorkoutSet: Identifiable, Codable {
    var id: UUID = UUID()
    var weight: Double = 0
    var reps: Int = 0
    var warmup: Bool = false
    var timestamp: Date = Date()
    var restSeconds: Int = 0
    // Cardio-specific (optional)
    var durationMinutes: Double? = nil
    var speed: Double? = nil
    var resistance: Int? = nil
}

// MARK: - A completed/saved workout
struct CompletedWorkout: Identifiable, Codable {
    var id: UUID = UUID()
    var dayId: String
    var dayLabel: String
    var startTime: Date
    var endTime: Date
    var duration: TimeInterval
    var exercises: [SessionExercise]
    var calories: Double
}
