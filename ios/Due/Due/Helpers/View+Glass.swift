import SwiftUI

extension View {
    @ViewBuilder
    func duGlass<S: Shape>(in shape: S = RoundedRectangle(cornerRadius: DuTheme.radiusLarge)) -> some View {
        if #available(iOS 26, *) {
            self.glassEffect(.regular, in: shape)
                .overlay {
                    shape.stroke(Color.violet200.opacity(0.12), lineWidth: 0.5)
                }
        } else {
            self
                .background {
                    Color(.systemBackground).opacity(0.4)
                        .clipShape(shape)
                }
                .overlay {
                    shape.stroke(Color.violet200.opacity(0.22), lineWidth: 1)
                }
        }
    }

    @ViewBuilder
    func duGlassInteractive<S: Shape>(in shape: S = RoundedRectangle(cornerRadius: DuTheme.radiusLarge)) -> some View {
        if #available(iOS 26, *) {
            self.glassEffect(.regular.interactive(), in: shape)
                .overlay {
                    shape.stroke(Color.violet200.opacity(0.12), lineWidth: 0.5)
                }
        } else {
            self
                .background {
                    Color(.systemBackground).opacity(0.4)
                        .clipShape(shape)
                }
                .overlay {
                    shape.stroke(Color.violet200.opacity(0.22), lineWidth: 1)
                }
        }
    }

    @ViewBuilder
    func duNavigationGlass() -> some View {
        if #available(iOS 26, *) {
            self.toolbarBackgroundVisibility(.visible, for: .navigationBar)
        } else {
            self
        }
    }

    func duGradientBackground() -> some View {
        modifier(DuGradientBackgroundModifier())
    }
}

private struct DuGradientBackgroundModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        content
            .background {
                DuTheme.surfaceGradient(for: colorScheme)
                    .ignoresSafeArea()
            }
    }
}
