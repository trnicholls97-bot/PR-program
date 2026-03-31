import Foundation
import SwiftUI

// MARK: - Exercise (from bundle JSON)
struct Exercise: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var name: String
    var muscle: String
    var met: Double
    var targetSets: String
    var targetReps: String
    var targetWeight: Double
    var isCardio: Bool
}

// MARK: - Day definitions (built-in, not user-editable)
struct DayDefinition: Identifiable {
    let id: String
    let label: String
    let icon: String
}

// MARK: - Custom user-created days
struct CustomDayDefinition: Identifiable, Codable {
    var id: UUID = UUID()
    var name: String
    var icon: String
}

// MARK: - Exercise help video
struct HelpVideo: Codable {
    let youtubeId: String
    let label: String
}

// MARK: - Exercise variations (grip/style)
struct ExerciseVariation: Codable {
    let exerciseName: String
    let options: [String]
}

// MARK: - PR status for set display
enum PRStatus: Equatable {
    case new, up, equal, down

    var symbol: String {
        switch self {
        case .new, .up: return "+"
        case .equal: return "="
        case .down: return "−"
        }
    }

    var color: Color {
        switch self {
        case .new, .up: return Color(red: 0.224, green: 0.851, blue: 0.541)  // green
        case .equal: return Color(red: 0.0, green: 0.478, blue: 1.0)         // blue
        case .down: return Color(red: 1.0, green: 0.302, blue: 0.427)        // red
        }
    }
}

// MARK: - Theme
enum ThemeMode: String, Codable, CaseIterable {
    case dark, light

    var displayName: String {
        switch self {
        case .dark: return "Dark"
        case .light: return "Light"
        }
    }
}

// MARK: - Color extension for hex
extension Color {
    init?(hex: String) {
        var h = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if h.hasPrefix("#") { h = String(h.dropFirst()) }
        guard h.count == 6, let val = UInt64(h, radix: 16) else { return nil }
        let r = Double((val >> 16) & 0xFF) / 255
        let g = Double((val >> 8) & 0xFF) / 255
        let b = Double(val & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }

    func toHex() -> String {
        let ui = UIColor(self)
        var r: CGFloat = 0; var g: CGFloat = 0; var b: CGFloat = 0; var a: CGFloat = 0
        ui.getRed(&r, green: &g, blue: &b, alpha: &a)
        return String(format: "#%02X%02X%02X", Int(r*255), Int(g*255), Int(b*255))
    }
}
