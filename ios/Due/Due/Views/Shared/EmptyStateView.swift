import SwiftUI

struct EmptyStateView: View {
    let icon: String
    let title: String
    let subtitle: String
    var iconColor: Color = Color.duVioletAdaptive.opacity(0.5)
    var ctaTitle: String? = nil
    var onCTA: (() -> Void)? = nil

    @State private var appeared = false

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 44))
                .foregroundStyle(iconColor)
                .symbolEffect(.bounce, value: appeared)

            VStack(spacing: 6) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(.primary)

                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            if let ctaTitle, let onCTA {
                Button {
                    HapticManager.impact(.light)
                    onCTA()
                } label: {
                    Text(ctaTitle)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 10)
                        .background(Color.duVioletAdaptive, in: Capsule())
                }
                .pressableStyle()
                .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity, minHeight: 200)
        .opacity(appeared ? 1 : 0)
        .offset(y: appeared ? 0 : 12)
        .animation(DuTheme.defaultSpring, value: appeared)
        .onAppear {
            appeared = true
        }
    }
}
