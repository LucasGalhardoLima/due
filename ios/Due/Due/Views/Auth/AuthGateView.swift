import SwiftUI

// Minimal entry gate.
// The redesigned app keeps everything in the user's hands — the only "gate" is
// whether they've completed the 3-step onboarding once. Clerk-based sign-in
// re-enters the picture in a separate pass.
struct AuthGateView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @State private var theme = AppTheme()

    var body: some View {
        Group {
            if hasCompletedOnboarding {
                RootView()
            } else {
                OnboardingView(onDone: {
                    withAnimation(.spring(response: 0.45, dampingFraction: 0.85)) {
                        hasCompletedOnboarding = true
                    }
                })
            }
        }
        .environment(theme)
        .preferredColorScheme(theme.mode.preferredColorScheme)
        .animation(.spring(response: 0.5, dampingFraction: 0.85), value: hasCompletedOnboarding)
    }
}
