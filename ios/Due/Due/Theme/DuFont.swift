import SwiftUI

// Geist family — display (sans) + mono.
// All numeric/UI labels use mono per the prototype's `mono: "all"` default.
enum DuFont {
    static let displayName = "Geist"
    static let monoName = "GeistMono"

    static func display(_ size: CGFloat, weight: Weight = .regular) -> Font {
        .custom(name(for: weight, mono: false), fixedSize: size)
    }

    static func mono(_ size: CGFloat, weight: Weight = .regular) -> Font {
        .custom(name(for: weight, mono: true), fixedSize: size)
    }

    static func displayRel(_ size: CGFloat, weight: Weight = .regular, relativeTo style: Font.TextStyle = .body) -> Font {
        .custom(name(for: weight, mono: false), size: size, relativeTo: style)
    }

    enum Weight {
        case regular, medium, semibold, bold

        var suffix: String {
            switch self {
            case .regular: return "Regular"
            case .medium: return "Medium"
            case .semibold: return "SemiBold"
            case .bold: return "Bold"
            }
        }
    }

    private static func name(for weight: Weight, mono: Bool) -> String {
        let family = mono ? monoName : displayName
        return "\(family)-\(weight.suffix)"
    }
}
