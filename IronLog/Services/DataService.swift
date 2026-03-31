import Foundation

class DataService {
    private(set) var exercises: [Exercise] = []
    private(set) var helpVideos: [String: HelpVideo] = [:]

    // Maps exercise name (lowercased, spaces->underscores) to HelpVideo
    private var helpVideosByKey: [String: HelpVideo] = [:]

    // MARK: - Static data

    static let defaultDayPlans: [String: [String]] = [
        "chest":     ["Barbell Bench Press", "Incline Dumbbell Bench Press", "Machine Pectoral Fly", "Triceps Pushdown (machine)", "Tricep Pushdown (bar)", "Decline Sit-ups", "Cardio"],
        "back":      ["Landmine Rows", "Seated/Low Row", "Assisted Pullups", "Pulldowns", "Standing Bicep Curls", "Decline Sit-ups", "Cardio"],
        "shoulders": ["Overhead Barbell Press", "Single-Arm Rear Delt Flys", "Dumbbell Lateral Raises", "Cable Lateral Raises", "Cardio"],
        "legs":      ["Hack Squat", "Leg Press", "Quad Extensions (machine)", "Laying Hamstring Curls (machine)", "Glute/Back Extensions or Hip Thrusts", "Decline Sit-ups", "Cardio"],
        "misc":      []
    ]

    static let dayDefinitions: [DayDefinition] = [
        DayDefinition(id: "chest",     label: "Chest Day",    icon: "💪"),
        DayDefinition(id: "back",      label: "Back Day",     icon: "🏋️"),
        DayDefinition(id: "shoulders", label: "Shoulder Day", icon: "🔱"),
        DayDefinition(id: "legs",      label: "Leg Day",      icon: "🦵"),
        DayDefinition(id: "misc",      label: "Misc",         icon: "⚡"),
    ]

    static let muscleOrder: [String] = [
        "Chest", "Back", "Shoulders", "Quads", "Hamstrings",
        "Glutes", "Calves", "Biceps", "Triceps", "Core", "Cardio"
    ]

    static let muscleIcons: [String: String] = [
        "Chest": "💪", "Back": "🏋️", "Shoulders": "🔱",
        "Quads": "🦵", "Hamstrings": "🦵", "Glutes": "🍑",
        "Calves": "🦵", "Biceps": "💪", "Triceps": "💪",
        "Core": "🔥", "Cardio": "🏃"
    ]

    static let exerciseVariations: [String: [String]] = [
        "Pull-ups":               ["Standard", "Wide Grip", "Close Grip", "Hammer Grip"],
        "Assisted Pullups":       ["Standard", "Wide Grip", "Chin-Up", "Hammer Grip"],
        "Pulldowns":              ["Wide Grip", "Close Grip", "Reverse Grip", "Single Arm"],
        "Pulldowns (close grip)": ["Close Grip", "Wide Grip", "Underhand"],
        "Chin-ups":               ["Standard", "Wide Grip", "Close Grip"],
        "Barbell Bench Press":    ["Standard", "Wide Grip", "Close Grip"],
        "Barbell Curl":           ["Standard", "Wide Grip", "Close Grip"],
        "Standing Bicep Curls":   ["Standard", "Wide Grip", "Close Grip", "Hammer"],
        "Dumbbell Curl":          ["Standard", "Supinating", "Hammer"],
        "Cable Curl":             ["Standard", "Rope", "Bar", "Single Arm"],
        "Seated/Low Row":         ["Narrow Grip", "Wide Grip", "Overhand"],
        "Cable Row (wide grip)":  ["Wide Grip", "Narrow Grip", "Single Arm"],
        "Overhead Barbell Press": ["Standard", "Behind Neck", "Seated"],
        "Tricep Pushdown (bar)":  ["Bar", "Rope", "V-Bar", "Single Arm"],
        "Tricep Pushdown (rope)": ["Rope", "Bar", "V-Bar"],
        "Leg Press":              ["Standard", "Narrow Stance", "Wide Stance", "Single Leg"],
        "Hip Thrusts (barbell)":  ["Standard", "Single Leg", "Banded"],
        "Glute/Back Extensions":  ["Standard", "Weighted", "Single Leg"]
    ]

    // MARK: - Init
    init() {
        loadExercises()
        loadHelpVideos()
    }

    // MARK: - Query helpers
    func exercises(forMuscle muscle: String) -> [Exercise] {
        exercises.filter { $0.muscle == muscle }
    }

    /// Look up help video by exercise name. Tries exact snake_case key first,
    /// then a few known mappings.
    func helpVideo(for exerciseName: String) -> HelpVideo? {
        let key = exerciseName.lowercased()
            .replacingOccurrences(of: " ", with: "_")
            .replacingOccurrences(of: "-", with: "_")
            .replacingOccurrences(of: "(", with: "")
            .replacingOccurrences(of: ")", with: "")
            .replacingOccurrences(of: "/", with: "_")
        return helpVideosByKey[key]
    }

    // MARK: - Private loading
    private func loadExercises() {
        guard let url = Bundle.main.url(forResource: "exercises", withExtension: "json"),
              let data = try? Data(contentsOf: url) else { return }
        // exercises.json is an array of ExerciseJSON objects
        struct ExerciseJSON: Codable {
            let name: String
            let muscle: String
            let met: Double
            let targetSets: String
            let targetReps: String
            let targetWeight: Double
            let isCardio: Bool
        }
        guard let decoded = try? JSONDecoder().decode([ExerciseJSON].self, from: data) else { return }
        exercises = decoded.map { j in
            Exercise(name: j.name, muscle: j.muscle, met: j.met,
                     targetSets: j.targetSets, targetReps: j.targetReps,
                     targetWeight: j.targetWeight, isCardio: j.isCardio)
        }
    }

    private func loadHelpVideos() {
        guard let url = Bundle.main.url(forResource: "exercise-help", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let decoded = try? JSONDecoder().decode([String: HelpVideo].self, from: data) else { return }
        helpVideosByKey = decoded
    }
}
