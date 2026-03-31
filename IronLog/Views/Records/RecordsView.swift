import SwiftUI

struct RecordsView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        NavigationStack {
            Group {
                if appState.personalRecords.isEmpty && appState.cardioPRs.isEmpty {
                    emptyState
                } else {
                    muscleGroupList
                }
            }
            .navigationTitle("Records")
        }
    }

    // MARK: - Muscle group list

    private var muscleGroupList: some View {
        List {
            ForEach(DataService.muscleOrder, id: \.self) { muscle in
                let exercises = exercisesWithPRs(forMuscle: muscle)
                if !exercises.isEmpty {
                    NavigationLink {
                        ExercisePRListView(muscle: muscle, exercises: exercises)
                    } label: {
                        HStack {
                            Text(DataService.muscleIcons[muscle] ?? "")
                                .font(.title2)
                                .frame(width: 36)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(muscle)
                                    .font(.headline)
                                Text("\(exercises.count) exercise\(exercises.count == 1 ? "" : "s")")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text("\(exercises.count)")
                                .font(.caption.bold())
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Capsule().fill(appState.accentColor.opacity(0.2)))
                                .foregroundStyle(appState.accentColor)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "trophy")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("No Records Yet")
                .font(.title2.bold())
            Text("Complete workouts to start tracking personal records.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
    }

    // MARK: - Helper

    private func exercisesWithPRs(forMuscle muscle: String) -> [Exercise] {
        appState.allExercises.filter { exercise in
            exercise.muscle == muscle && (
                appState.personalRecords[exercise.name] != nil ||
                appState.cardioPRs[exercise.name] != nil
            )
        }
    }
}

// MARK: - Exercise PR list

struct ExercisePRListView: View {
    @Environment(AppState.self) private var appState
    let muscle: String
    let exercises: [Exercise]

    var body: some View {
        List {
            ForEach(exercises) { exercise in
                NavigationLink {
                    PRDetailView(exercise: exercise)
                } label: {
                    if exercise.isCardio, let pr = appState.cardioPRs[exercise.name] {
                        cardioPRRow(exercise: exercise, pr: pr)
                    } else if let pr = appState.personalRecords[exercise.name] {
                        strengthPRRow(exercise: exercise, pr: pr)
                    }
                }
            }
        }
        .navigationTitle(muscle)
        .listStyle(.insetGrouped)
    }

    private func strengthPRRow(exercise: Exercise, pr: PersonalRecord) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(appState.displayName(for: exercise.name))
                .font(.headline)
            HStack(spacing: 12) {
                Label("\(pr.weight, specifier: "%.1f") lbs × \(pr.reps)", systemImage: "scalemass")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Label("e1RM: \(pr.e1rm, specifier: "%.1f")", systemImage: "chart.line.uptrend.xyaxis")
                    .font(.caption)
                    .foregroundStyle(appState.accentColor)
            }
            Text(pr.date.formatted(date: .abbreviated, time: .omitted))
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }

    private func cardioPRRow(exercise: Exercise, pr: CardioPR) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(appState.displayName(for: exercise.name))
                .font(.headline)
            HStack(spacing: 8) {
                if let duration = pr.durationMinutes {
                    Label("\(duration, specifier: "%.0f") min", systemImage: "clock")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                if let speed = pr.speed {
                    Label("\(speed, specifier: "%.1f") mph", systemImage: "speedometer")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                if let resistance = pr.resistance {
                    Label("R\(resistance)", systemImage: "arrow.up.and.down")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            Text(pr.date.formatted(date: .abbreviated, time: .omitted))
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - PR detail view

struct PRDetailView: View {
    @Environment(AppState.self) private var appState
    let exercise: Exercise

    var body: some View {
        List {
            // Current PR section
            if let pr = appState.personalRecords[exercise.name] {
                Section("Personal Record") {
                    LabeledContent("Weight", value: "\(pr.weight, specifier: "%.1f") lbs")
                    LabeledContent("Reps", value: "\(pr.reps)")
                    LabeledContent("Estimated 1RM", value: "\(pr.e1rm, specifier: "%.1f") lbs")
                    LabeledContent("Date", value: pr.date.formatted(date: .long, time: .omitted))
                }
            }

            // Historical sets section
            let history = historicalSets
            if !history.isEmpty {
                Section("History (All Sets)") {
                    ForEach(Array(history.enumerated()), id: \.offset) { _, entry in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("\(entry.weight, specifier: "%.1f") lbs × \(entry.reps) reps")
                                    .font(.subheadline)
                                Text(entry.date.formatted(date: .abbreviated, time: .shortened))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            if !entry.warmup {
                                Text("e1RM: \(appState.prService.calculateE1RM(weight: entry.weight, reps: entry.reps), specifier: "%.1f")")
                                    .font(.caption)
                                    .foregroundStyle(appState.accentColor)
                            } else {
                                Text("Warmup")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            } else {
                Section("History") {
                    Text("No historical data found.")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle(appState.displayName(for: exercise.name))
        .listStyle(.insetGrouped)
    }

    private struct SetEntry {
        let weight: Double
        let reps: Int
        let warmup: Bool
        let date: Date
    }

    private var historicalSets: [SetEntry] {
        var entries: [SetEntry] = []
        for workout in appState.workoutHistory.reversed() {
            for ex in workout.exercises where ex.name == exercise.name {
                for set in ex.sets {
                    entries.append(SetEntry(
                        weight: set.weight,
                        reps: set.reps,
                        warmup: set.warmup,
                        date: set.timestamp
                    ))
                }
            }
        }
        return entries
    }
}
