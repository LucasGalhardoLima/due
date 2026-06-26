import SwiftUI
import UIKit

extension Color {
    init(hex: UInt32, alpha: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }

    init(light: Color, dark: Color) {
        self.init(UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(dark)
                : UIColor(light)
        })
    }

    // ─── Du foreground / surface tokens (mirror prototype's fg/fgMuted/fgFaint/surface/border)

    static let duFg = Color(light: Color(hex: 0x0A0B0D), dark: .white)
    static let duFgMuted = Color(
        light: Color(hex: 0x0A0B0D, alpha: 0.55),
        dark: Color(white: 1.0, opacity: 0.55)
    )
    static let duFgFaint = Color(
        light: Color(hex: 0x0A0B0D, alpha: 0.32),
        dark: Color(white: 1.0, opacity: 0.32)
    )
    static let duSurface = Color(
        light: Color(hex: 0x0A0B0D, alpha: 0.03),
        dark: Color(white: 1.0, opacity: 0.04)
    )
    static let duSurfaceHi = Color(
        light: Color(hex: 0x0A0B0D, alpha: 0.05),
        dark: Color(white: 1.0, opacity: 0.06)
    )
    static let duBorder = Color(
        light: Color(hex: 0x0A0B0D, alpha: 0.08),
        dark: Color(white: 1.0, opacity: 0.08)
    )
    static let duBorderHi = Color(
        light: Color(hex: 0x0A0B0D, alpha: 0.14),
        dark: Color(white: 1.0, opacity: 0.14)
    )
    static let duBg = Color(light: Color(hex: 0xFAFAFA), dark: Color(hex: 0x0A0B0D))

    // ─── Status

    static let duDanger = Color(hex: 0xF87171)
    static let duWarn = Color(hex: 0xFBBF24)
    static let duOk = Color(hex: 0x4ADE80)
}
