import Foundation
import Observation

@Observable
class WorkoutSessionViewModel {

    // MARK: - State
    var session: WorkoutSession?
    var workoutElapsed: TimeInterval = 0
    var restElapsed: TimeInterval = 0
    var isRunning: Bool = false

    // MARK: - Private timer state
    private var workoutTimer: Timer?
    private var restTimer: Timer?
    private var restPaused: TimeInterval = 0
    private var anySetLogged: Bool = false

    // MARK: - Formatted time helpers
    var formattedWorkoutTime: String {
        formatTime(workoutElapsed)
    }

    var formattedRestTime: String {
        formatTime(restElapsed)
    }

    private func formatTime(_ interval: TimeInterval) -> String {
        let totalSeconds = Int(interval)
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        }
        return String(format: "%02d:%02d", minutes, seconds)
    }

    // MARK: - Timer control

    /// Start (or resume) both timers.
    func start() {
        guard !isRunning else { return }
        isRunning = true

        workoutTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.workoutElapsed += 1
        }
        RunLoop.main.add(workoutTimer!, forMode: .common)

        if anySetLogged {
            startRestTimer()
        }
    }

    /// Pause both timers; saves rest position.
    func pause() {
        guard isRunning else { return }
        isRunning = false
        restPaused = restElapsed

        workoutTimer?.invalidate()
        workoutTimer = nil
        restTimer?.invalidate()
        restTimer = nil
    }

    private func startRestTimer() {
        restTimer?.invalidate()
        restTimer = nil

        restTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.restElapsed += 1
        }
        RunLoop.main.add(restTimer!, forMode: .common)
    }

    private func stopAllTimers() {
        workoutTimer?.invalidate()
        workoutTimer = nil
        restTimer?.invalidate()
        restTimer = nil
    }

    // MARK: - Session lifecycle

    func startSession(dayId: String, dayLabel: String) {
        let newSession = WorkoutSession(
            dayId: dayId,
            dayLabel: dayLabel,
            startTime: Date()
        )
        session = newSession
        workoutElapsed = 0
        restElapsed = 0
        restPaused = 0
        anySetLogged = false
        start()
    }

    /// Finishes the session, calculates calories, appends to appState, resets state.
    @discardableResult
    func finish(appState: AppState) -> CompletedWorkout? {
        guard let currentSession = session else { return nil }

        stopAllTimers()
        isRunning = false

        let endTime = Date()
        let duration = workoutElapsed

        // Calculate total calories burned across all exercises
        let durationHours = duration / 3600.0
        let calories = appState.calorieService.caloriesBurned(
            exercises: currentSession.exercises,
            durationHours: durationHours,
            profile: appState.profile
        )

        let completed = CompletedWorkout(
            dayId: currentSession.dayId,
            dayLabel: currentSession.dayLabel,
            startTime: currentSession.startTime,
            endTime: endTime,
            duration: duration,
            exercises: currentSession.exercises,
            calories: calories
        )

        // Reset all state
        session = nil
        workoutElapsed = 0
        restElapsed = 0
        restPaused = 0
        anySetLogged = false

        return completed
    }

    // MARK: - Exercise management

    func addExercise(_ exercise: Exercise, variation: String? = nil) {
        guard session != nil else { return }
        let sessionExercise = SessionExercise(
            name: exercise.name,
            muscle: exercise.muscle,
            targetSets: exercise.targetSets,
            targetReps: exercise.targetReps,
            targetWeight: exercise.targetWeight,
            variation: variation,
            isCardio: exercise.isCardio,
            met: exercise.met
        )
        session?.exercises.insert(sessionExercise, at: 0)
    }

    // MARK: - Set management

    func addSet(to exerciseId: UUID, weight: Double, reps: Int, warmup: Bool) {
        guard let idx = session?.exercises.firstIndex(where: { $0.id == exerciseId }) else { return }

        let newSet = WorkoutSet(
            weight: weight,
            reps: reps,
            warmup: warmup,
            timestamp: Date(),
            restSeconds: Int(restElapsed)
        )

        session?.exercises[idx].sets.append(newSet)

        // Mark first meaningful set
        if !session!.exercises[idx].hasLoggedFirstSet && (weight > 0 || reps > 0) {
            session?.exercises[idx].hasLoggedFirstSet = true
            anySetLogged = true

            // Start rest timer for the first time if running
            if isRunning {
                restElapsed = 0
                startRestTimer()
            }
        } else if anySetLogged {
            // Reset rest timer for subsequent sets
            restElapsed = 0
            restPaused = 0
            if isRunning {
                startRestTimer()
            }
        }
    }

    func removeSet(from exerciseId: UUID, setId: UUID) {
        guard let exIdx = session?.exercises.firstIndex(where: { $0.id == exerciseId }) else { return }
        session?.exercises[exIdx].sets.removeAll { $0.id == setId }
    }

    func toggleWarmup(exerciseId: UUID, setId: UUID) {
        guard let exIdx = session?.exercises.firstIndex(where: { $0.id == exerciseId }),
              let setIdx = session?.exercises[exIdx].sets.firstIndex(where: { $0.id == setId }) else { return }
        session?.exercises[exIdx].sets[setIdx].warmup.toggle()
    }

    func toggleExpanded(_ exerciseId: UUID) {
        guard let idx = session?.exercises.firstIndex(where: { $0.id == exerciseId }) else { return }
        session?.exercises[idx].isExpanded.toggle()
    }
}
