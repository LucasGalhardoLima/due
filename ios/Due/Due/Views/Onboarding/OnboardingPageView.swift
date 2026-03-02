import SwiftUI

struct OnboardingPageView: View {
    let emoji: String
    let title: String
    let subtitle: String
    var isIntroPage: Bool = false

    @State private var appeared = false
    @State private var waveRotation: Double = 0

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Text(emoji)
                .font(.system(size: 72))
                .opacity(appeared ? 1 : 0)
                .offset(y: appeared ? 0 : 30)
                .scaleEffect(appeared ? 1.0 : 0.3)
                .rotationEffect(.degrees(waveRotation), anchor: .bottomTrailing)
                .animation(DuTheme.bouncySpring.delay(0.15), value: appeared)

            VStack(spacing: 12) {
                Text(title)
                    .font(.title2.bold())
                    .multilineTextAlignment(.center)
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 24)
                    .scaleEffect(appeared ? 1.0 : 0.85)
                    .animation(DuTheme.dramaticSpring.delay(0.35), value: appeared)

                Text(subtitle)
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 18)
                    .animation(DuTheme.gentleSpring.delay(0.55), value: appeared)
            }
            .padding(.horizontal, 32)

            Spacer()
            Spacer()
        }
        .onAppear {
            appeared = true
            if isIntroPage {
                startWaveAnimation()
            }
        }
        .onDisappear {
            appeared = false
            waveRotation = 0
        }
    }

    private func startWaveAnimation() {
        let waveDuration: Double = 0.4
        let startDelay: Double = 0.8

        // 3 cycles: rotate +20°, then -20°, then back to 0°
        withAnimation(Animation.easeInOut(duration: waveDuration).delay(startDelay)) {
            waveRotation = 20
        }
        withAnimation(Animation.easeInOut(duration: waveDuration).delay(startDelay + waveDuration)) {
            waveRotation = -20
        }
        withAnimation(Animation.easeInOut(duration: waveDuration).delay(startDelay + waveDuration * 2)) {
            waveRotation = 20
        }
        withAnimation(Animation.easeInOut(duration: waveDuration).delay(startDelay + waveDuration * 3)) {
            waveRotation = -20
        }
        withAnimation(Animation.easeInOut(duration: waveDuration).delay(startDelay + waveDuration * 4)) {
            waveRotation = 20
        }
        withAnimation(Animation.easeInOut(duration: waveDuration).delay(startDelay + waveDuration * 5)) {
            waveRotation = 0
        }
    }
}
