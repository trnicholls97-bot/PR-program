import SwiftUI

struct SetRowView: View {
    let setIndex: Int
    let set: WorkoutSet
    let exerciseName: String
    let prs: [String: PersonalRecord]
    let prService: PRService
    let onUpdate: (WorkoutSet) -> Void
    let onToggleWarmup: () -> Void
    let onDelete: () -> Void

    @State private var weightText: String = ""
    @State private var repsText: String = ""
    @FocusState private var weightFocused: Bool
    @FocusState private var repsFocused: Bool

    init(
        setIndex: Int,
        set: WorkoutSet,
        exerciseName: String,
        prs: [String: PersonalRecord],
        prService: PRService,
        onUpdate: @escaping (WorkoutSet) -> Void,
        onToggleWarmup: @escaping () -> Void,
        onDelete: @escaping () -> Void
    ) {
        self.setIndex = setIndex
        self.set = set
        self.exerciseName = exerciseName
        self.prs = prs
        self.prService = prService
        self.onUpdate = onUpdate
        self.onToggleWarmup = onToggleWarmup
        self.onDelete = onDelete
        _weightText = State(initialValue: set.weight > 0 ? formatWeight(set.weight) : "")
        _repsText = State(initialValue: set.reps > 0 ? "\(set.reps)" : "")
    }

    var body: some View {
        HStack(spacing: 6) {
            // Set number badge
            ZStack {
                Circle()
                    .fill(set.warmup ? Color.blue.opacity(0.15) : Color(.tertiarySystemBackground))
                    .frame(width: 28, height: 28)
                Text("\(setIndex + 1)")
                    .font(.caption2.bold())
                    .foregroundStyle(set.warmup ? .blue : .secondary)
            }
            .frame(width: 28)

            // Warmup toggle
            Button(action: onToggleWarmup) {
                ZStack {
                    Circle()
                        .fill(set.warmup ? Color.blue : Color(.tertiarySystemBackground))
                        .frame(width: 28, height: 28)
                    Text("W")
                        .font(.caption.bold())
                        .foregroundStyle(set.warmup ? .white : .secondary)
                }
            }
            .buttonStyle(.plain)
            .frame(width: 32)

            // Weight field
            TextField("0", text: $weightText)
                .keyboardType(.decimalPad)
                .focused($weightFocused)
                .multilineTextAlignment(.center)
                .font(.subheadline.monospacedDigit())
                .frame(maxWidth: .infinity)
                .padding(.vertical, 6)
                .background(Color(.tertiarySystemBackground))
                .cornerRadius(6)
                .onChange(of: weightText) { _, newValue in
                    var updated = set
                    updated.weight = Double(newValue) ?? 0
                    onUpdate(updated)
                }
                .onChange(of: weightFocused) { _, focused in
                    if !focused {
                        // Clean up formatting on blur
                        if let val = Double(weightText), val > 0 {
                            weightText = formatWeight(val)
                        }
                    }
                }

            // Reps field
            TextField("0", text: $repsText)
                .keyboardType(.numberPad)
                .focused($repsFocused)
                .multilineTextAlignment(.center)
                .font(.subheadline.monospacedDigit())
                .frame(width: 50)
                .padding(.vertical, 6)
                .background(Color(.tertiarySystemBackground))
                .cornerRadius(6)
                .onChange(of: repsText) { _, newValue in
                    var updated = set
                    updated.reps = Int(newValue) ?? 0
                    onUpdate(updated)
                }

            // Rest time
            Text(formatRest(set.restSeconds))
                .font(.caption.monospacedDigit())
                .foregroundStyle(.secondary)
                .frame(width: 44, alignment: .center)

            // PR badge
            prBadge
                .frame(width: 28)
        }
        .padding(.vertical, 6)
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive, action: onDelete) {
                Label("Delete", systemImage: "trash")
            }
        }
        .onAppear {
            // Sync text fields if set changed externally
            if set.weight > 0 && weightText.isEmpty {
                weightText = formatWeight(set.weight)
            }
            if set.reps > 0 && repsText.isEmpty {
                repsText = "\(set.reps)"
            }
        }
    }

    // MARK: - PR badge

    @ViewBuilder
    private var prBadge: some View {
        let currentWeight = Double(weightText) ?? set.weight
        let currentReps = Int(repsText) ?? set.reps

        if let status = prService.prStatus(
            exerciseName: exerciseName,
            weight: currentWeight,
            reps: currentReps,
            warmup: set.warmup,
            prs: prs
        ) {
            Text(status.symbol)
                .font(.caption.bold())
                .foregroundStyle(status.color)
                .frame(width: 22, height: 22)
                .background(
                    Circle().fill(status.color.opacity(0.15))
                )
        } else {
            Color.clear
                .frame(width: 22, height: 22)
        }
    }

    // MARK: - Helpers

    private func formatRest(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }
}

private func formatWeight(_ value: Double) -> String {
    if value.truncatingRemainder(dividingBy: 1) == 0 {
        return String(Int(value))
    }
    return String(format: "%.1f", value)
}
