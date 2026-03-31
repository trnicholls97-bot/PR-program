import Foundation

class CalorieService {

    // MARK: - TDEE
    func calculateTDEE(profile: UserProfile) -> Double {
        guard profile.age > 0, profile.weightLbs > 0 else { return 0 }
        let weightKg = profile.weightLbs * 0.453592
        let heightCm = (Double(profile.heightFt) * 12.0 + Double(profile.heightIn)) * 2.54

        switch profile.formula {
        case .mifflin:
            let bmr = mifflinBMR(weightKg: weightKg, heightCm: heightCm,
                                  age: profile.age, sex: profile.sex)
            return bmr * 1.375

        case .mifflinLean:
            guard profile.bodyFatPct > 0 else { return 0 }
            let leanKg = weightKg * (1 - profile.bodyFatPct / 100)
            // Mifflin using lean mass as weight proxy
            let bmr = mifflinBMR(weightKg: leanKg, heightCm: heightCm,
                                  age: profile.age, sex: profile.sex)
            return bmr * 1.375

        case .katch:
            guard profile.bodyFatPct > 0 else { return 0 }
            let leanKg = weightKg * (1 - profile.bodyFatPct / 100)
            let bmr = 370 + 21.6 * leanKg
            return bmr * 1.375

        case .navy:
            // Estimate BF% from navy method, then use Katch
            guard let bfPct = navyBodyFat(profile: profile) else { return 0 }
            let leanKg = weightKg * (1 - bfPct / 100)
            let bmr = 370 + 21.6 * leanKg
            return bmr * 1.375
        }
    }

    // MARK: - Workout calorie burn
    func caloriesBurned(exercises: [SessionExercise], durationHours: Double, profile: UserProfile) -> Double {
        guard durationHours > 0, profile.weightLbs > 0 else { return 0 }
        let leanKg = leanMassKg(profile: profile)
        let avgMET = exercises.isEmpty ? 4.5 : exercises.map { $0.met }.reduce(0, +) / Double(exercises.count)
        return avgMET * leanKg * durationHours
    }

    // MARK: - Helpers
    private func mifflinBMR(weightKg: Double, heightCm: Double, age: Int, sex: Sex) -> Double {
        let base = 10 * weightKg + 6.25 * heightCm - 5.0 * Double(age)
        return sex == .male ? base + 5 : base - 161
    }

    private func leanMassKg(profile: UserProfile) -> Double {
        let totalKg = profile.weightLbs * 0.453592
        let bf = profile.bodyFatPct > 0 ? profile.bodyFatPct / 100 : 0.20
        return totalKg * (1 - bf)
    }

    /// Navy method body fat % estimation
    private func navyBodyFat(profile: UserProfile) -> Double? {
        guard profile.neckIn > 0, profile.waistIn > 0, profile.heightFt > 0 else { return nil }
        let heightIn = Double(profile.heightFt) * 12 + Double(profile.heightIn)
        if profile.sex == .male {
            // BF% = 86.010 x log10(abdomen - neck) - 70.041 x log10(height) + 36.76
            guard profile.waistIn > profile.neckIn else { return nil }
            return 86.010 * log10(profile.waistIn - profile.neckIn) - 70.041 * log10(heightIn) + 36.76
        } else {
            // Female needs hip measurement
            guard profile.hipIn > 0 else { return nil }
            return 163.205 * log10(profile.waistIn + profile.hipIn - profile.neckIn) - 97.684 * log10(heightIn) - 78.387
        }
    }
}
