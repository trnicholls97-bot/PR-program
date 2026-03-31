import SwiftUI

struct ExercisePickerView: View {
    @Environment(AppState.self) private var appState
    @Environment(WorkoutSessionViewModel.self) private var sessionVM
    @Environment(\.dismiss) private var dismiss

    @State private var searchText = ""
    @State private var selectedMuscle: String? = nil
    @State private var exerciseForVariation: Exercise? = nil

    private let muscleFilters: [String] = [
        "All", "Chest", "Back", "Shoulders", "Quads",
        "Hamstrings", "Glutes", "Calves", "Biceps",
        "Triceps", "Core", "Cardio"
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Muscle filter chips
                muscleFilterScroll

                Divider()

                // Exercise list
                exerciseList
            }
            .navigationTitle("Add Exercise")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search exercises")
            .sheet(item: $exerciseForVariation) { exercise in
                VariationPickerView(exercise: exercise) { variation in
                    sessionVM.addExercise(exercise, variation: variation)
                    dismiss()
                }
            }
        }
    }

    // MARK: - Muscle filter chips

    private var muscleFilterScroll: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(muscleFilters, id: \.self) { muscle in
                    let isSelected = (muscle == "All" && selectedMuscle == nil) || selectedMuscle == muscle
                    Button {
                        selectedMuscle = (muscle == "All") ? nil : muscle
                    } label: {
                        Text(muscle)
                            .font(.subheadline)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 7)
                            .background(
                                Capsule()
                                    .fill(isSelected ? appState.accentColor : Color(.secondarySystemBackground))
                            )
                            .foregroundStyle(isSelected ? .white : .primary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 10)
        }
    }

    // MARK: - Exercise list

    private var exerciseList: some View {
        List {
            // Day plan exercises first
            let dayExercises = planExercises
            if !dayExercises.isEmpty && searchText.isEmpty && selectedMuscle == nil {
                Section("Today's Plan") {
                    ForEach(dayExercises) { exercise in
                        exerciseRow(exercise, highlighted: true)
                    }
                }
            }

            // Remaining exercises
            let others = otherExercises
            if !others.isEmpty {
                Section(dayExercises.isEmpty || !searchText.isEmpty || selectedMuscle != nil ? "" : "All Exercises") {
                    ForEach(others) { exercise in
                        exerciseRow(exercise, highlighted: false)
                    }
                }
            }

            if filteredExercises.isEmpty {
                ContentUnavailableView(
                    "No exercises found",
                    systemImage: "magnifyingglass",
                    description: Text("Try a different search or muscle group")
                )
            }
        }
        .listStyle(.plain)
    }

    // MARK: - Exercise row

    @ViewBuilder
    private func exerciseRow(_ exercise: Exercise, highlighted: Bool) -> some View {
        Button {
            selectExercise(exercise)
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(appState.displayName(for: exercise.name))
                        .font(.body)
                        .foregroundStyle(.primary)
                    Text(exercise.muscle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                if highlighted {
                    Image(systemName: "star.fill")
                        .font(.caption)
                        .foregroundStyle(appState.accentColor)
                }
                Image(systemName: "plus.circle")
                    .foregroundStyle(appState.accentColor)
            }
        }
        .listRowBackground(highlighted ? appState.accentColor.opacity(0.08) : nil)
    }

    // MARK: - Selection logic

    private func selectExercise(_ exercise: Exercise) {
        let variations = DataService.exerciseVariations[exercise.name]
        if let variations, !variations.isEmpty {
            exerciseForVariation = exercise
        } else {
            sessionVM.addExercise(exercise)
            dismiss()
        }
    }

    // MARK: - Filtered data

    private var filteredExercises: [Exercise] {
        appState.allExercises.filter { exercise in
            let matchesMuscle = selectedMuscle == nil || exercise.muscle == selectedMuscle
            let matchesSearch = searchText.isEmpty ||
                exercise.name.localizedCaseInsensitiveContains(searchText) ||
                exercise.muscle.localizedCaseInsensitiveContains(searchText)
            return matchesMuscle && matchesSearch
        }
    }

    private var currentDayExerciseNames: Set<String> {
        let dayId = sessionVM.session?.dayId ?? ""
        let names = appState.dayPlans[dayId] ?? []
        return Set(names)
    }

    private var planExercises: [Exercise] {
        let names = currentDayExerciseNames
        return filteredExercises.filter { names.contains($0.name) }
    }

    private var otherExercises: [Exercise] {
        let names = currentDayExerciseNames
        let alreadyShown = !searchText.isEmpty || selectedMuscle != nil
        if alreadyShown {
            return filteredExercises
        }
        return filteredExercises.filter { !names.contains($0.name) }
    }
}

// MARK: - Variation picker sheet

struct VariationPickerView: View {
    let exercise: Exercise
    let onSelect: (String?) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Button("No Variation") {
                    onSelect(nil)
                    dismiss()
                }
                .foregroundStyle(.secondary)

                ForEach(DataService.exerciseVariations[exercise.name] ?? [], id: \.self) { variation in
                    Button(variation) {
                        onSelect(variation)
                        dismiss()
                    }
                    .foregroundStyle(.primary)
                }
            }
            .navigationTitle("Select Variation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
