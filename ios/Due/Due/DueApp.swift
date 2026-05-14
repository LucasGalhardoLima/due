import SwiftUI

@main
struct DueApp: App {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @State private var theme = AppTheme()

    var body: some Scene {
        WindowGroup {
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
}
