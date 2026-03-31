import SwiftUI

struct ExerciseBlockView: View {
    @Environment(AppState.self) private var appState
    @Environment(WorkoutSessionViewModel.self) private var sessionVM

    let exercise: SessionExercise

    var body: some View {
        VStack(spacing: 0) {
            headerRow
            if exercise.isExpanded {
                Divider()
                expandedContent
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color(.secondarySystemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(Color(.separator), lineWidth: 0.5)
        )
    }

    // MARK: - Header

    private var headerRow: some View {
        Button {
            sessionVM.toggleExpanded(exercise.id)
        } label: {
            HStack(spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(displayName)
                        .font(.headline)
                        .foregroundStyle(.primary)
                        .multilineTextAlignment(.leading)
                    Text(exercise.muscle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()

                HelpButton(
                    exerciseName: exercise.name,
                    dataService: appState.dataService
                )

                Image(systemName: exercise.isExpanded ? "chevron.up" : "chevron.down")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
        }
        .buttonStyle(.plain)
    }

    // MARK: - Expanded content

    private var expandedContent: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Target info
            if !exercise.targetSets.isEmpty || !exercise.targetReps.isEmpty || exercise.targetWeight > 0 {
                targetInfoRow
                    .padding(.horizontal)
                    .padding(.top, 8)
            }

            if !exercise.sets.isEmpty {
                // Table header
                setTableHeader
                    .padding(.horizontal)

                Divider()
                    .padding(.horizontal)

                // Set rows
                ForEach(Array(exercise.sets.enumerated()), id: \.element.id) { idx, set in
                    SetRowView(
                        setIndex: idx,
                        set: set,
                        exerciseName: exercise.name,
                        prs: appState.personalRecords,
                        prService: appState.prService
                    ) { updatedSet in
                        updateSet(updatedSet)
                    } onToggleWarmup: {
                        sessionVM.toggleWarmup(exerciseId: exercise.id, setId: set.id)
                    } onDelete: {
                        sessionVM.removeSet(from: exercise.id, setId: set.id)
                    }
                    .padding(.horizontal)

                    if idx < exercise.sets.count - 1 {
                        Divider()
                            .padding(.horizontal)
                    }
                }
            }

            // Add Set button
            addSetButton
                .padding(.horizontal)
                .padding(.bottom, 10)
                .padding(.top, exercise.sets.isEmpty ? 8 : 0)
        }
    }

    // MARK: - Target info

    private var targetInfoRow: some View {
        HStack(spacing: 12) {
            Image(systemName: "target")
                .font(.caption)
                .foregroundStyle(.secondary)
            HStack(spacing: 4) {
                if !exercise.targetSets.isEmpty {
                    Text("\(exercise.targetSets) sets")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                if !exercise.targetReps.isEmpty {
                    Text("×")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                    Text("\(exercise.targetReps) reps")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                if exercise.targetWeight > 0 {
                    Text("@")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                    Text("\(exercise.targetWeight, specifier: "%.1f") lbs")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    // MARK: - Set table header

    private var setTableHeader: some View {
        HStack {
            Text("Set")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .frame(width: 28, alignment: .center)
            Text("WU")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .frame(width: 32, alignment: .center)
            Text("Weight (lbs)")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity)
            Text("Reps")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .frame(width: 50)
            Text("Rest")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .frame(width: 44)
            Text("PR")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .frame(width: 28)
        }
        .padding(.top, 4)
    }

    // MARK: - Add Set button

    private var addSetButton: some View {
        Button {
            addSet()
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "plus.circle")
                Text("Add Set")
            }
            .font(.subheadline)
            .foregroundStyle(appState.accentColor)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(appState.accentColor.opacity(0.1))
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Helpers

    private var displayName: String {
        if let variation = exercise.variation, !variation.isEmpty {
            return "\(exercise.name) (\(variation))"
        }
        return exercise.name
    }

    private func addSet() {
        let sets = exercise.sets
        let warmupCount = appState.warmupDefaultCount
        let warmupEnabled = appState.warmupEnabled

        // Determine if this should be a warmup set
        let isWarmup = warmupEnabled && sets.count < warmupCount

        // Use last set values, or fall back to target
        let lastWeight: Double
        let lastReps: Int

        if let last = sets.last {
            lastWeight = last.weight
            lastReps = last.reps
        } else {
            lastWeight = exercise.targetWeight
            lastReps = Int(exercise.targetReps) ?? 5
        }

        sessionVM.addSet(
            to: exercise.id,
            weight: lastWeight,
            reps: lastReps,
            warmup: isWarmup
        )
    }

    private func updateSet(_ updatedSet: WorkoutSet) {
        guard let exIdx = sessionVM.session?.exercises.firstIndex(where: { $0.id == exercise.id }),
              let setIdx = sessionVM.session?.exercises[exIdx].sets.firstIndex(where: { $0.id == updatedSet.id }) else { return }
        sessionVM.session?.exercises[exIdx].sets[setIdx] = updatedSet

        // Record PR if applicable
        if !updatedSet.warmup && updatedSet.weight > 0 && updatedSet.reps > 0 {
            appState.recordSetIfPR(
                exerciseName: exercise.name,
                weight: updatedSet.weight,
                reps: updatedSet.reps,
                isWarmup: updatedSet.warmup
            )
        }
    }
}
