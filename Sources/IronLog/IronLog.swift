import SwiftUI

// MARK: - Data Models

struct Exercise: Identifiable, Codable {
    let id: String
    let name: String
    let muscle: String
    let met: Double
    let targetSets: String
    let targetReps: String
    let targetWeight: Double

    init(name: String, muscle: String, met: Double, targetSets: String, targetReps: String, targetWeight: Double = 0) {
        self.id = UUID().uuidString
        self.name = name
        self.muscle = muscle
        self.met = met
        self.targetSets = targetSets
        self.targetReps = targetReps
        self.targetWeight = targetWeight
    }
}

struct WorkoutSet: Identifiable, Codable {
    let id: String
    var repsCompleted: Int
    var weightUsed: Double
    var exercise: Exercise

    init(exercise: Exercise, repsCompleted: Int = 0, weightUsed: Double = 0) {
        self.id = UUID().uuidString
        self.exercise = exercise
        self.repsCompleted = repsCompleted
        self.weightUsed = weightUsed
    }
}

struct Workout: Identifiable, Codable {
    let id: String
    let date: Date
    let dayType: String
    var sets: [WorkoutSet]

    var totalCalories: Double {
        sets.reduce(0) { total, set in
            total + (set.exercise.met * Double(set.repsCompleted) / 60.0 * 0.04)
        }
    }

    init(date: Date, dayType: String, sets: [WorkoutSet] = []) {
        self.id = UUID().uuidString
        self.date = date
        self.dayType = dayType
        self.sets = sets
    }
}

struct DayPlan: Identifiable {
    let id: String
    let label: String
    let icon: String
    let exerciseNames: [String]

    init(id: String, label: String, icon: String, exerciseNames: [String]) {
        self.id = id
        self.label = label
        self.icon = icon
        self.exerciseNames = exerciseNames
    }
}

// MARK: - Exercise Library

class ExerciseLibrary {
    static let shared = ExerciseLibrary()

    let exercises: [Exercise]
    let dayPlans: [DayPlan]

    private init() {
        self.exercises = Self.createExerciseLibrary()
        self.dayPlans = Self.createDayPlans()
    }

    private static func createExerciseLibrary() -> [Exercise] {
        [
            // CHEST
            Exercise(name: "Barbell Bench Press", muscle: "Chest", met: 5.5, targetSets: "4-5 warmup + 5 working", targetReps: "5-8"),
            Exercise(name: "Dumbbell Bench Press", muscle: "Chest", met: 5.0, targetSets: "4", targetReps: "8-12"),
            Exercise(name: "Incline Dumbbell Bench Press", muscle: "Chest", met: 5.0, targetSets: "3", targetReps: "8-12"),
            Exercise(name: "Machine Pectoral Fly", muscle: "Chest", met: 3.5, targetSets: "4", targetReps: "10-15"),
            Exercise(name: "Push-ups", muscle: "Chest", met: 4.0, targetSets: "3", targetReps: "15-20"),

            // BACK
            Exercise(name: "Barbell Deadlift", muscle: "Back", met: 6.5, targetSets: "4-5 warmup + 3 working", targetReps: "3-6"),
            Exercise(name: "Barbell Row", muscle: "Back", met: 6.0, targetSets: "4", targetReps: "6-10"),
            Exercise(name: "Landmine Rows", muscle: "Back", met: 5.5, targetSets: "4-5 warmup + 5 working", targetReps: "5-8"),
            Exercise(name: "Seated/Low Row", muscle: "Back", met: 5.0, targetSets: "4", targetReps: "8-12"),
            Exercise(name: "Assisted Pullups", muscle: "Back", met: 5.0, targetSets: "4", targetReps: "6-10"),
            Exercise(name: "Pulldowns", muscle: "Back", met: 5.0, targetSets: "4", targetReps: "8-12"),
            Exercise(name: "Pull-ups", muscle: "Back", met: 5.5, targetSets: "4", targetReps: "5-10"),
            Exercise(name: "Standing Bicep Curls", muscle: "Biceps", met: 3.5, targetSets: "5", targetReps: "8-12"),
            Exercise(name: "Decline Sit-ups", muscle: "Core", met: 4.0, targetSets: "5", targetReps: "15-20"),

            // SHOULDERS
            Exercise(name: "Overhead Barbell Press", muscle: "Shoulders", met: 5.5, targetSets: "4-5 warmup + 5 working", targetReps: "5-8"),
            Exercise(name: "Single-Arm Rear Delt Flys", muscle: "Shoulders", met: 3.0, targetSets: "4", targetReps: "12-15"),
            Exercise(name: "Dumbbell Lateral Raises", muscle: "Shoulders", met: 3.0, targetSets: "4", targetReps: "12-15"),
            Exercise(name: "Cable Lateral Raises", muscle: "Shoulders", met: 3.0, targetSets: "4", targetReps: "12-15"),

            // LEGS
            Exercise(name: "Hack Squat", muscle: "Quads", met: 6.5, targetSets: "4-5 warmup + 5 working", targetReps: "5-8"),
            Exercise(name: "Leg Press", muscle: "Quads", met: 6.0, targetSets: "3", targetReps: "8-12"),
            Exercise(name: "Quad Extensions (machine)", muscle: "Quads", met: 4.5, targetSets: "4", targetReps: "10-15"),
            Exercise(name: "Laying Hamstring Curls (machine)", muscle: "Hamstrings", met: 4.5, targetSets: "4", targetReps: "10-15"),
            Exercise(name: "Glute/Back Extensions or Hip Thrusts", muscle: "Glutes", met: 5.5, targetSets: "4", targetReps: "10-15"),

            // CARDIO
            Exercise(name: "Cardio", muscle: "Cardio", met: 7.0, targetSets: "1", targetReps: "20 min"),
            Exercise(name: "Treadmill", muscle: "Cardio", met: 7.0, targetSets: "1", targetReps: "20 min"),
            Exercise(name: "Stationary Bike", muscle: "Cardio", met: 7.0, targetSets: "1", targetReps: "20 min"),

            // TRICEPS
            Exercise(name: "Triceps Pushdown (machine)", muscle: "Triceps", met: 3.5, targetSets: "4", targetReps: "10-15"),
            Exercise(name: "Tricep Pushdown (bar)", muscle: "Triceps", met: 3.5, targetSets: "4", targetReps: "10-15"),
        ]
    }

    private static func createDayPlans() -> [DayPlan] {
        [
            DayPlan(
                id: "chest",
                label: "Chest Day",
                icon: "💪",
                exerciseNames: [
                    "Barbell Bench Press",
                    "Incline Dumbbell Bench Press",
                    "Machine Pectoral Fly",
                    "Triceps Pushdown (machine)",
                    "Tricep Pushdown (bar)",
                    "Decline Sit-ups",
                    "Cardio"
                ]
            ),
            DayPlan(
                id: "back",
                label: "Back Day",
                icon: "🏋️",
                exerciseNames: [
                    "Landmine Rows",
                    "Seated/Low Row",
                    "Assisted Pullups",
                    "Pulldowns",
                    "Standing Bicep Curls",
                    "Decline Sit-ups",
                    "Cardio"
                ]
            ),
            DayPlan(
                id: "shoulders",
                label: "Shoulder Day",
                icon: "🔱",
                exerciseNames: [
                    "Overhead Barbell Press",
                    "Single-Arm Rear Delt Flys",
                    "Dumbbell Lateral Raises",
                    "Cable Lateral Raises",
                    "Cardio"
                ]
            ),
            DayPlan(
                id: "legs",
                label: "Leg Day",
                icon: "🦵",
                exerciseNames: [
                    "Hack Squat",
                    "Leg Press",
                    "Quad Extensions (machine)",
                    "Laying Hamstring Curls (machine)",
                    "Glute/Back Extensions or Hip Thrusts",
                    "Decline Sit-ups",
                    "Cardio"
                ]
            ),
        ]
    }

    func getExercise(by name: String) -> Exercise? {
        exercises.first { $0.name == name }
    }
}

// MARK: - View Models

@MainActor
class WorkoutViewModel: ObservableObject {
    @Published var workouts: [Workout] = []
    @Published var currentWorkout: Workout?
    @Published var selectedDayPlan: DayPlan?

    let exerciseLibrary = ExerciseLibrary.shared

    func startWorkout(with dayPlan: DayPlan) {
        let exercises = dayPlan.exerciseNames.compactMap { exerciseLibrary.getExercise(by: $0) }
        let sets = exercises.map { WorkoutSet(exercise: $0) }
        currentWorkout = Workout(date: Date(), dayType: dayPlan.label, sets: sets)
        selectedDayPlan = dayPlan
    }

    func addSet(for exercise: Exercise) {
        let newSet = WorkoutSet(exercise: exercise)
        currentWorkout?.sets.append(newSet)
    }

    func updateSet(_ set: WorkoutSet, reps: Int, weight: Double) {
        if let index = currentWorkout?.sets.firstIndex(where: { $0.id == set.id }) {
            currentWorkout?.sets[index].repsCompleted = reps
            currentWorkout?.sets[index].weightUsed = weight
        }
    }

    func completeWorkout() {
        if let workout = currentWorkout {
            workouts.append(workout)
            currentWorkout = nil
            selectedDayPlan = nil
        }
    }

    func getTotalCaloriesToday() -> Double {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        return workouts
            .filter { calendar.startOfDay(for: $0.date) == today }
            .reduce(0) { $0 + $1.totalCalories }
    }
}

// MARK: - Views

struct ContentView: View {
    @StateObject var viewModel = WorkoutViewModel()

    var body: some View {
        if viewModel.currentWorkout != nil {
            WorkoutDetailView(viewModel: viewModel)
        } else {
            DaySelectionView(viewModel: viewModel)
        }
    }
}

struct DaySelectionView: View {
    @ObservedObject var viewModel: WorkoutViewModel

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text("IronLog")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.white)
                    Text("Fitness Tracking")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 20)
                .padding(.top, 20)

                // Stats Card
                VStack(spacing: 12) {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Today's Calories")
                                .font(.caption)
                                .foregroundColor(.gray)
                            Text(String(format: "%.0f kcal", viewModel.getTotalCaloriesToday()))
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                        Spacer()
                        Text("🔥")
                            .font(.system(size: 40))
                    }
                    .padding(16)
                    .background(Color(red: 0.2, green: 0.15, blue: 0.1))
                    .cornerRadius(12)
                }
                .padding(.horizontal, 20)

                // Day Plans
                Text("Select Workout")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 20)
                    .padding(.top, 20)

                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(viewModel.exerciseLibrary.dayPlans) { plan in
                            Button(action: {
                                viewModel.startWorkout(with: plan)
                            }) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        HStack(spacing: 8) {
                                            Text(plan.icon)
                                                .font(.title)
                                            Text(plan.label)
                                                .font(.headline)
                                                .foregroundColor(.white)
                                        }
                                        Text("\(plan.exerciseNames.count) exercises")
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(.gray)
                                }
                                .padding(16)
                                .background(Color(red: 0.12, green: 0.12, blue: 0.12))
                                .cornerRadius(12)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 20)
                }

                Spacer()
            }
            .background(Color(red: 0.05, green: 0.05, blue: 0.05))
            .ignoresSafeArea()
        }
    }
}

struct WorkoutDetailView: View {
    @ObservedObject var viewModel: WorkoutViewModel
    @State private var selectedSetId: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading) {
                        if let plan = viewModel.selectedDayPlan {
                            HStack(spacing: 8) {
                                Text(plan.icon)
                                    .font(.title)
                                Text(plan.label)
                                    .font(.headline)
                                    .foregroundColor(.white)
                            }
                        }
                        if let workout = viewModel.currentWorkout {
                            Text(String(format: "%.0f kcal", workout.totalCalories))
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                    Spacer()
                    Button(action: {
                        viewModel.completeWorkout()
                    }) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.green)
                    }
                }
                .padding(16)
                .background(Color(red: 0.12, green: 0.12, blue: 0.12))

                // Sets List
                ScrollView {
                    VStack(spacing: 12) {
                        if let workout = viewModel.currentWorkout {
                            ForEach(workout.sets) { set in
                                SetRowView(
                                    set: set,
                                    viewModel: viewModel,
                                    isSelected: selectedSetId == set.id
                                )
                                .onTapGesture {
                                    selectedSetId = selectedSetId == set.id ? nil : set.id
                                }
                            }
                        }
                    }
                    .padding(16)
                }

                Spacer()
            }
            .background(Color(red: 0.05, green: 0.05, blue: 0.05))
            .ignoresSafeArea()
        }
    }
}

struct SetRowView: View {
    let set: WorkoutSet
    @ObservedObject var viewModel: WorkoutViewModel
    let isSelected: Bool

    @State private var reps: String = "0"
    @State private var weight: String = "0"

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(set.exercise.name)
                        .font(.headline)
                        .foregroundColor(.white)
                    Text("\(set.exercise.targetSets) sets • \(set.exercise.targetReps) reps")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                Spacer()
                if set.repsCompleted > 0 {
                    HStack(spacing: 4) {
                        if set.weightUsed > 0 {
                            Text(String(format: "%.0f lbs", set.weightUsed))
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                        Text("×\(set.repsCompleted)")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }
            }

            if isSelected {
                Divider()
                    .background(Color.gray.opacity(0.3))

                HStack(spacing: 12) {
                    VStack(alignment: .leading) {
                        Text("Weight (lbs)")
                            .font(.caption)
                            .foregroundColor(.gray)
                        TextField("0", text: $weight)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.decimalPad)
                    }

                    VStack(alignment: .leading) {
                        Text("Reps")
                            .font(.caption)
                            .foregroundColor(.gray)
                        TextField("0", text: $reps)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.numberPad)
                    }

                    Button(action: {
                        if let repsInt = Int(reps), let weightDouble = Double(weight) {
                            viewModel.updateSet(set, reps: repsInt, weight: weightDouble)
                        }
                    }) {
                        Text("Save")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(8)
                            .background(Color.blue)
                            .cornerRadius(6)
                    }
                }
            }
        }
        .padding(12)
        .background(Color(red: 0.12, green: 0.12, blue: 0.12))
        .cornerRadius(10)
    }
}

// MARK: - App Entry Point

@main
struct IronLogApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
    }
}
