import SwiftUI

struct ErrorView: View {
    var icon: String = "wifi.exclamationmark"
    let title: String
    let message: String
    var ctaTitle: String = "Tentar novamente"
    let onRetry: () -> Void

    @State private var pulsing = false

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundStyle(iconColor)
                .symbolEffect(.pulse, value: pulsing)

            VStack(spacing: 6) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(.primary)

                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Button {
                HapticManager.impact(.medium)
                onRetry()
            } label: {
                Text(ctaTitle)
                    .font(.subheadline.weight(.medium))
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
            }
            .buttonStyle(.bordered)
            .pressableStyle()
        }
        .frame(maxWidth: .infinity, minHeight: 300)
        .onAppear {
            pulsing = true
        }
    }

    private var iconColor: Color {
        switch icon {
        case "wifi.slash": .secondary
        case "clock.badge.exclamationmark": Color.statusWarning.opacity(0.8)
        case "exclamationmark.icloud": Color.statusWarning.opacity(0.8)
        case "lock.shield": Color.duVioletAdaptive.opacity(0.6)
        default: .secondary
        }
    }
}
