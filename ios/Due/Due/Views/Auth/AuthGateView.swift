import SwiftUI
import Clerk

struct AuthGateView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @Environment(\.colorScheme) private var colorScheme
    @State private var showSignIn = false
    @State private var welcomeAppeared = false

    var body: some View {
        Group {
            if Clerk.shared.user != nil {
                RootView()
            } else if !hasCompletedOnboarding {
                OnboardingView {
                    withAnimation(DuTheme.defaultSpring) {
                        hasCompletedOnboarding = true
                    }
                }
            } else {
                welcomeView
            }
        }
        .animation(DuTheme.gentleSpring, value: hasCompletedOnboarding)
    }

    private var welcomeView: some View {
        ZStack {
            DuTheme.onboardingGradient(for: colorScheme)
                .ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                VStack(spacing: 16) {
                    // Du logo component
                    RoundedRectangle(cornerRadius: DuTheme.radiusLarge)
                        .fill(Color.duTabAccent)
                        .frame(width: 64, height: 64)
                        .overlay(
                            Text("Du")
                                .font(.system(size: 24, weight: .bold, design: .rounded))
                                .foregroundStyle(.white)
                        )
                        .opacity(welcomeAppeared ? 1 : 0)
                        .scaleEffect(welcomeAppeared ? 1.0 : 0.3)
                        .animation(DuTheme.bouncySpring.delay(0.15), value: welcomeAppeared)

                    Text("Suas finanças sob controle.")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                        .opacity(welcomeAppeared ? 1 : 0)
                        .offset(y: welcomeAppeared ? 0 : 18)
                        .animation(DuTheme.gentleSpring.delay(0.35), value: welcomeAppeared)
                }

                Spacer()

                Button {
                    showSignIn = true
                } label: {
                    Text("Entrar")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.duTabAccent, in: Capsule())
                }
                .pressableStyle()
                .padding(.horizontal, 32)
                .padding(.bottom, 48)
                .opacity(welcomeAppeared ? 1 : 0)
                .scaleEffect(welcomeAppeared ? 1.0 : 0.92)
                .animation(DuTheme.gentleSpring.delay(0.55), value: welcomeAppeared)
            }
        }
        .sheet(isPresented: $showSignIn) {
            AuthView()
        }
        .onAppear {
            welcomeAppeared = true
        }
    }
}
