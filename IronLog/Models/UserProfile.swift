import Foundation

enum Sex: String, Codable, CaseIterable {
    case male, female

    var displayName: String {
        switch self {
        case .male: return "Male"
        case .female: return "Female"
        }
    }
}

enum TDEEFormula: String, Codable, CaseIterable {
    case mifflin
    case mifflinLean
    case katch
    case navy

    var displayName: String {
        switch self {
        case .mifflin: return "Mifflin-St Jeor"
        case .mifflinLean: return "Mifflin (Lean)"
        case .katch: return "Katch-McArdle"
        case .navy: return "Navy Method"
        }
    }

    var requiresBodyFat: Bool {
        self == .mifflinLean || self == .katch
    }

    var requiresNavy: Bool {
        self == .navy
    }
}

struct UserProfile: Codable {
    var age: Int = 0
    var sex: Sex = .male
    var weightLbs: Double = 0
    var heightFt: Int = 5
    var heightIn: Int = 10
    var formula: TDEEFormula = .mifflin
    var bodyFatPct: Double = 0
    var neckIn: Double = 0
    var waistIn: Double = 0
    var hipIn: Double = 0
}
