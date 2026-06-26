import SwiftUI

// Geist family — display (sans) + mono.
// All numeric/UI labels use mono per the prototype's `mono: "all"` default.
enum DuFont {
    static let displayName = "Geist"
    static let monoName = "GeistMono"

    static func display(_ size: CGFloat, weight: Weight = .regular) -> Font {
        .custom(name(for: weight, mono: false), size: size, relativeTo: textStyle(for: size))
    }

    static func mono(_ size: CGFloat, weight: Weight = .regular) -> Font {
        .custom(name(for: weight, mono: true), size: size, relativeTo: textStyle(for: size))
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

    /// Maps a design-token point size to the closest UIKit TextStyle so
    /// Dynamic Type scaling preserves the intended visual hierarchy.
    static func textStyle(for size: CGFloat) -> Font.TextStyle {
        switch size {
        case ..<12:  return .caption2
        case 12..<14: return .caption
        case 14..<15: return .subheadline
        case 15..<17: return .callout
        case 17..<19: return .body
        case 19..<22: return .title3
        default:     return .title2
        }
    }

    private static func name(for weight: Weight, mono: Bool) -> String {
        let family = mono ? monoName : displayName
        return "\(family)-\(weight.suffix)"
    }
}
