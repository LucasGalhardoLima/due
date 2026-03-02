import SwiftUI

enum DuTheme {
    // MARK: - Spring Animations

    static let defaultSpring = Animation.spring(response: 0.4, dampingFraction: 0.75)
    static let gentleSpring = Animation.spring(response: 0.6, dampingFraction: 0.8)
    static let snappySpring = Animation.spring(response: 0.3, dampingFraction: 0.7)
    static let bouncySpring = Animation.spring(response: 0.5, dampingFraction: 0.6)
    static let dramaticSpring = Animation.spring(response: 0.55, dampingFraction: 0.65)

    // MARK: - Corner Radii

    static let radiusSmall: CGFloat = 8
    static let radiusMedium: CGFloat = 14
    static let radiusLarge: CGFloat = 20
    static let radiusXL: CGFloat = 28

    // MARK: - Gradient Helpers

    static func onboardingGradient(for colorScheme: ColorScheme) -> LinearGradient {
        switch colorScheme {
        case .dark:
            return LinearGradient(
                colors: [
                    Color.violet500.opacity(0.7),
                    Color.violet400.opacity(0.35),
                    Color.clear
                ],
                startPoint: .bottom,
                endPoint: .top
            )
        default:
            return LinearGradient(
                colors: [
                    Color.mint200.opacity(0.55),
                    Color.mint100.opacity(0.2),
                    Color.clear
                ],
                startPoint: .bottom,
                endPoint: .top
            )
        }
    }

    static func surfaceGradient(for colorScheme: ColorScheme) -> LinearGradient {
        switch colorScheme {
        case .dark:
            return LinearGradient(
                colors: [
                    Color.violet500.opacity(0.6),
                    Color.violet400.opacity(0.3),
                    Color.clear
                ],
                startPoint: .bottom,
                endPoint: .top
            )
        default:
            return LinearGradient(
                colors: [
                    Color.mint200.opacity(0.35),
                    Color.clear
                ],
                startPoint: .bottom,
                endPoint: .top
            )
        }
    }
}
