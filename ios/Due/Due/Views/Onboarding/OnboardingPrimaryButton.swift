import SwiftUI

struct OnboardingPrimaryButton: View {
    @Environment(AppTheme.self) private var theme
    let title: String
    let enabled: Bool
    var icon: String = "arrow.right"

    var body: some View {
        HStack {
            Text(title)
                .font(DuFont.display(15, weight: .semibold))
                .foregroundStyle(enabled ? .white : Color.duFgFaint)
            Spacer()
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(enabled ? .white : Color.duFgFaint)
        }
        .padding(.horizontal, 20).padding(.vertical, 16)
        .background(
            enabled ? AnyShapeStyle(theme.palette.primary) : AnyShapeStyle(Color.duSurface),
            in: RoundedRectangle(cornerRadius: 14, style: .continuous)
        )
        .opacity(enabled ? 1.0 : 0.5)
    }
}

struct OnboardingSecondaryButton: View {
    let title: String
    var icon: String = "arrow.left"

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Color.duFgMuted)
            Text(title)
                .font(DuFont.mono(14, weight: .medium))
                .foregroundStyle(Color.duFgMuted)
            Spacer()
        }
        .padding(.horizontal, 16).padding(.vertical, 14)
        .background(Color.duSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.duBorder, lineWidth: 1)
        )
    }
}
