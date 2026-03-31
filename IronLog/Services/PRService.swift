import Foundation
import SwiftUI

class PRService {

    /// Dumbbell exercises: the user enters per-dumbbell weight; actual weight is x2
    func isDumbbell(_ name: String) -> Bool {
        let lower = name.lowercased()
        return lower.contains("dumbbell") || lower.contains(" db ")
    }

    /// Brzycki estimated 1-rep max
    func calculateE1RM(weight: Double, reps: Int) -> Double {
        guard reps > 0 else { return weight }
        return weight * (1.0 + Double(reps) / 30.0)
    }

    /// Returns the PR status for a set, or nil if not applicable
    func prStatus(exerciseName: String, weight: Double, reps: Int,
                  warmup: Bool, prs: [String: PersonalRecord]) -> PRStatus? {
        guard !warmup, reps > 0, weight > 0 else { return nil }
        let effectiveWeight = isDumbbell(exerciseName) ? weight * 2 : weight
        let newE1RM = calculateE1RM(weight: effectiveWeight, reps: reps)
        guard let existing = prs[exerciseName] else { return .new }
        let diff = newE1RM - existing.e1rm
        if diff > 0.001 { return .up }
        if abs(diff) <= 0.001 { return .equal }
        return .down
    }
}
