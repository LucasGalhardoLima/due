import SwiftUI

// One of the four user-pickable accent palettes from the prototype.
enum DuPalette: String, CaseIterable, Identifiable, Codable {
    case cyberMint
    case tokyoNight
    case aurora
    case sunset

    var id: String { rawValue }

    var name: String {
        switch self {
        case .cyberMint: return "Cyber Mint"
        case .tokyoNight: return "Tokyo Night"
        case .aurora: return "Aurora"
        case .sunset: return "Sunset"
        }
    }

    var subtitle: String {
        switch self {
        case .cyberMint: return "Mais Du"
        case .tokyoNight: return "Calmo, técnico"
        case .aurora: return "Suave, criativo"
        case .sunset: return "Quente, energético"
        }
    }

    var primary: Color {
        switch self {
        case .cyberMint: return Color(hex: 0x14B8A6)
        case .tokyoNight: return Color(hex: 0x7AA2F7)
        case .aurora: return Color(hex: 0xA78BFA)
        case .sunset: return Color(hex: 0xFB923C)
        }
    }

    var primaryDark: Color {
        switch self {
        case .cyberMint: return Color(hex: 0x0D9488)
        case .tokyoNight: return Color(hex: 0x5A82D7)
        case .aurora: return Color(hex: 0x7C5CE6)
        case .sunset: return Color(hex: 0xE07A28)
        }
    }

    var gradient: LinearGradient {
        LinearGradient(
            colors: [primary, primaryDark],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}
