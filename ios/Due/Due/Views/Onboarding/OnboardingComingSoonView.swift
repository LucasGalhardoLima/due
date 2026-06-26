import SwiftUI

struct OnboardingComingSoonView: View {
    let title: String
    let bodyText: String
    var onBack: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Em breve")
                .font(DuFont.mono(13, weight: .medium))
                .tracking(2.0)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)

            Text(title)
                .font(DuFont.mono(30, weight: .bold))
                .kerning(-0.6)
                .foregroundStyle(Color.duFg)
                .padding(.top, 16)

            Text(bodyText)
                .font(DuFont.mono(14))
                .lineSpacing(4)
                .foregroundStyle(Color.duFgMuted)
                .padding(.top, 14)

            Spacer(minLength: 24)

            Button {
                HapticManager.impact(.light)
                onBack()
            } label: {
                OnboardingSecondaryButton(title: "Escolher outra forma")
            }
            .buttonStyle(.pressable)
        }
    }
}
