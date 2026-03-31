import SwiftUI

struct ActiveWorkoutView: View {
    @Environment(AppState.self) private var appState
    @Environment(WorkoutSessionViewModel.self) private var sessionVM
    @Environment(\.dismiss) private var dismiss

    @State private var showExercisePicker = false
    @State private var showFinishAlert = false

    var body: some View {
        VStack(spacing: 0) {
            // Timer bar pinned at top
            TimerBarView(onFinish: { showFinishAlert = true })
                .padding(.horizontal)
                .padding(.vertical, 8)
                .background(Color(.secondarySystemBackground))

            Divider()

            if let session = sessionVM.session {
                if session.exercises.isEmpty {
                    emptyState
                } else {
                    exerciseList(session: session)
                }
            }

            // Add exercise button pinned at bottom
            addExerciseButton
        }
        .navigationTitle(sessionVM.session?.dayLabel ?? "Workout")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showFinishAlert = true
                } label: {
                    Label("Finish", systemImage: "checkmark.circle.fill")
                        .foregroundStyle(appState.accentColor)
                }
            }
        }
        .sheet(isPresented: $showExercisePicker) {
            ExercisePickerView()
        }
        .alert("Finish Workout?", isPresented: $showFinishAlert) {
            Button("Finish", role: .destructive) {
                finishWorkout()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will save your workout and end the session.")
        }
        .onChange(of: sessionVM.session == nil) { _, isNil in
            if isNil {
                dismiss()
            }
        }
    }

    // MARK: - Exercise list

    private func exerciseList(session: WorkoutSession) -> some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(session.exercises) { exercise in
                    ExerciseBlockView(exercise: exercise)
                        .padding(.horizontal)
                }
            }
            .padding(.vertical, 12)
        }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "dumbbell")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No exercises yet")
                .font(.headline)
                .foregroundStyle(.secondary)
            Text("Tap \"Add Exercise\" to get started")
                .font(.subheadline)
                .foregroundStyle(.tertiary)
            Spacer()
        }
    }

    // MARK: - Add exercise button

    private var addExerciseButton: some View {
        Button {
            showExercisePicker = true
        } label: {
            Label("Add Exercise", systemImage: "plus.circle.fill")
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(appState.accentColor)
                .foregroundStyle(.white)
        }
    }

    // MARK: - Finish

    private func finishWorkout() {
        guard let completed = sessionVM.finish(appState: appState) else { return }
        appState.workoutHistory.append(completed)
        appState.save()
    }
}
