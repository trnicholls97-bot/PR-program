import Foundation
import SwiftUI
import Observation

// MARK: - Nested model types used by AppState

struct PersonalRecord: Codable {
    var weight: Double       // effective weight (dumbbell x 2 if applicable)
    var reps: Int
    var e1rm: Double         // Brzycki estimated 1RM
    var date: Date
}

struct CardioPR: Codable {
    var durationMinutes: Double?
    var speed: Double?
    var resistance: Int?
    var date: Date
}

struct ExerciseOverride: Codable {
    var targetSets: String
    var targetReps: String
    var targetWeight: Double
}

struct UserInfo {
    let uid: String
    let displayName: String?
    let email: String?
}

// MARK: - AppState

@Observable
class AppState {
    // Profile & TDEE
    var profile: UserProfile = UserProfile()

    // Workout history
    var workoutHistory: [CompletedWorkout] = []

    // Personal records
    var personalRecords: [String: PersonalRecord] = [:]
    var cardioPRs: [String: CardioPR] = [:]

    // Day plans & custom days
    var dayPlans: [String: [String]] = DataService.defaultDayPlans
    var customDays: [CustomDayDefinition] = []

    // Custom exercises
    var customExercises: [Exercise] = []

    // Per-exercise overrides (custom target sets/reps/weight)
    var exerciseOverrides: [String: ExerciseOverride] = [:]
    var exerciseNameOverrides: [String: String] = [:]
    var dayIconOverrides: [String: String] = [:]

    // Settings
    var warmupEnabled: Bool = true
    var warmupDefaultCount: Int = 4
    var themeMode: ThemeMode = .dark
    var accentHex: String = "#ff6b35"

    // Auth
    var currentUser: UserInfo? = nil
    var isSignedIn: Bool = false

    // Services (not persisted)
    let dataService: DataService
    let prService: PRService
    let calorieService: CalorieService
    let firebaseService: FirebaseService
    private let persistence: PersistenceService

    init() {
        self.dataService = DataService()
        self.prService = PRService()
        self.calorieService = CalorieService()
        self.firebaseService = FirebaseService()
        self.persistence = PersistenceService()
        persistence.load(into: self)
        firebaseService.onAuthChange = { [weak self] user in
            self?.currentUser = user
            self?.isSignedIn = user != nil
        }
    }

    // MARK: - Persistence
    func save() {
        persistence.save(self)
    }

    // MARK: - Helpers
    var accentColor: Color {
        Color(hex: accentHex) ?? .orange
    }

    func displayName(for exercise: String) -> String {
        exerciseNameOverrides[exercise] ?? exercise
    }

    // MARK: - PR update
    func recordSetIfPR(exerciseName: String, weight: Double, reps: Int, isWarmup: Bool) {
        guard !isWarmup, reps > 0, weight > 0 else { return }
        let isDumbbell = prService.isDumbbell(exerciseName)
        let effectiveWeight = isDumbbell ? weight * 2 : weight
        let newE1RM = prService.calculateE1RM(weight: effectiveWeight, reps: reps)
        if let existing = personalRecords[exerciseName], newE1RM <= existing.e1rm { return }
        personalRecords[exerciseName] = PersonalRecord(
            weight: effectiveWeight, reps: reps, e1rm: newE1RM, date: Date()
        )
        save()
    }

    // MARK: - TDEE
    var tdee: Double {
        calorieService.calculateTDEE(profile: profile)
    }

    // MARK: - All exercises (built-in + custom)
    var allExercises: [Exercise] {
        dataService.exercises + customExercises
    }
}
