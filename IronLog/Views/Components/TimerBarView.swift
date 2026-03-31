import SwiftUI

struct TimerBarView: View {
    @Environment(WorkoutSessionViewModel.self) private var sessionVM
    let onFinish: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Workout elapsed time (left)
            HStack(spacing: 6) {
                Image(systemName: "stopwatch.fill")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(sessionVM.formattedWorkoutTime)
                    .font(.title3.monospacedDigit().bold())
                    .foregroundStyle(.primary)
            }

            Spacer()

            // Rest timer (center, only after first set)
            if sessionVM.session?.exercises.contains(where: { $0.hasLoggedFirstSet }) == true {
                HStack(spacing: 5) {
                    Image(systemName: "timer")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(sessionVM.formattedRestTime)
                        .font(.subheadline.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                .transition(.opacity.combined(with: .scale))

                Spacer()
            }

            // Play/Pause button
            Button {
                if sessionVM.isRunning {
                    sessionVM.pause()
                } else {
                    sessionVM.start()
                }
            } label: {
                Image(systemName: sessionVM.isRunning ? "pause.fill" : "play.fill")
                    .font(.title3)
                    .foregroundStyle(.primary)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(Color(.tertiarySystemBackground)))
            }
            .buttonStyle(.plain)

            // Finish button
            Button(action: onFinish) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.title3)
                    .foregroundStyle(.green)
                    .frame(width: 36, height: 36)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color(.secondarySystemBackground))
        )
        .animation(.easeInOut(duration: 0.2), value: sessionVM.session?.exercises.contains(where: { $0.hasLoggedFirstSet }) ?? false)
    }
}
