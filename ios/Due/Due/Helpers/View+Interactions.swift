import SwiftUI

// MARK: - Pressable Button Style

struct PressableButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .opacity(configuration.isPressed ? 0.9 : 1.0)
            .animation(DuTheme.snappySpring, value: configuration.isPressed)
    }
}

extension View {
    func pressableStyle() -> some View {
        self.buttonStyle(PressableButtonStyle())
    }
}

// MARK: - Staggered Appearance

struct StaggeredAppearanceModifier: ViewModifier {
    let index: Int
    @State private var appeared = false

    func body(content: Content) -> some View {
        content
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 12)
            .animation(
                DuTheme.defaultSpring.delay(Double(index) * 0.05),
                value: appeared
            )
            .onAppear {
                appeared = true
            }
    }
}

extension View {
    func staggeredAppearance(index: Int) -> some View {
        modifier(StaggeredAppearanceModifier(index: index))
    }
}

// MARK: - Animated Currency Text

struct AnimatedCurrencyText: View {
    let value: Double

    var body: some View {
        Text(CurrencyFormatter.format(value))
            .contentTransition(.numericText(value: value))
            .animation(DuTheme.defaultSpring, value: value)
    }
}
