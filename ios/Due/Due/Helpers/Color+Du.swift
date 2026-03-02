import SwiftUI
import UIKit

extension Color {
    // MARK: - Adaptive init

    init(light: Color, dark: Color) {
        self.init(UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(dark)
                : UIColor(light)
        })
    }

    // MARK: - Primary palette

    static let mint = Color(red: 214/255, green: 255/255, blue: 246/255)       // #D6FFF6
    static let deepPurple = Color(red: 35/255, green: 22/255, blue: 81/255)    // #231651

    // MARK: - Adaptive primary colors

    static let duVioletAdaptive = Color(light: .deepPurple, dark: Color(red: 184/255, green: 169/255, blue: 255/255))
    static let duMintAdaptive = Color(light: .mint, dark: Color(red: 100/255, green: 200/255, blue: 180/255))
    static let duTabAccent = Color(
        light: .mint500,
        dark: Color(red: 184/255, green: 169/255, blue: 255/255)
    )
    static let duSurface = Color("duSurface")
    static let duAccent = Color("duAccent")

    // MARK: - Mint ramp

    static let mint50 = Color(red: 240/255, green: 255/255, blue: 252/255)
    static let mint100 = Color(red: 214/255, green: 255/255, blue: 246/255)
    static let mint200 = Color(red: 170/255, green: 240/255, blue: 225/255)
    static let mint300 = Color(red: 120/255, green: 220/255, blue: 200/255)
    static let mint400 = Color(red: 70/255, green: 195/255, blue: 175/255)
    static let mint500 = Color(red: 30/255, green: 165/255, blue: 145/255)

    // MARK: - Violet ramp

    static let violet50 = Color(red: 240/255, green: 235/255, blue: 255/255)
    static let violet100 = Color(red: 210/255, green: 200/255, blue: 255/255)
    static let violet200 = Color(red: 160/255, green: 140/255, blue: 230/255)
    static let violet300 = Color(red: 110/255, green: 85/255, blue: 200/255)
    static let violet400 = Color(red: 75/255, green: 50/255, blue: 160/255)
    static let violet500 = Color(red: 35/255, green: 22/255, blue: 81/255)

    // MARK: - Status colors

    static let statusSuccess = Color(red: 34/255, green: 197/255, blue: 94/255)
    static let statusWarning = Color(red: 250/255, green: 204/255, blue: 21/255)
    static let statusDanger = Color(red: 239/255, green: 68/255, blue: 68/255)
    static let statusInfo = Color(red: 59/255, green: 130/255, blue: 246/255)

    // MARK: - Status background variants (adaptive)

    static let statusSuccessBg = Color(light: statusSuccess.opacity(0.12), dark: statusSuccess.opacity(0.2))
    static let statusWarningBg = Color(light: statusWarning.opacity(0.12), dark: statusWarning.opacity(0.2))
    static let statusDangerBg = Color(light: statusDanger.opacity(0.12), dark: statusDanger.opacity(0.2))
    static let statusInfoBg = Color(light: statusInfo.opacity(0.12), dark: statusInfo.opacity(0.2))
}

extension ShapeStyle where Self == Color {
    static var duMint: Color { .mint }
    static var duDeepPurple: Color { .deepPurple }
}
