import SwiftUI
import Clerk

struct OnboardingView: View {
    let onComplete: () -> Void

    @Environment(\.colorScheme) private var colorScheme
    @State private var currentPage = 0
    @State private var controlsAppeared = false
    @State private var showSignIn = false

    private let pages: [(emoji: String, title: String, subtitle: String)] = [
        ("👋", "Oi, eu sou o Du!", "Seu assistente financeiro pessoal. Tô aqui pra te ajudar a dominar sua vida financeira."),
        ("📊", "Me conta tudo", "Importa seu extrato ou adiciona na mão. Eu organizo seus gastos, cartões e parcelas em segundos."),
        ("💳", "Eu organizo tudo pra você", "Faturas, parcelas, assinaturas, orçamento por categoria. Tudo num lugar só."),
        ("🎯", "E te digo o que fazer", "Analiso seus padrões e te dou dicas sob medida. Sem julgamento, só solução.")
    ]

    var body: some View {
        ZStack {
            DuTheme.onboardingGradient(for: colorScheme)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Skip button
                HStack {
                    Spacer()
                    Button("Pular") {
                        HapticManager.selection()
                        showSignIn = true
                    }
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 24)
                    .padding(.top, 8)
                }

                // Pages
                TabView(selection: $currentPage) {
                    ForEach(Array(pages.enumerated()), id: \.offset) { index, page in
                        OnboardingPageView(
                            emoji: page.emoji,
                            title: page.title,
                            subtitle: page.subtitle,
                            isIntroPage: index == 0
                        )
                        .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))

                // Custom indicators + CTA
                VStack(spacing: 28) {
                    // Capsule indicators
                    HStack(spacing: 8) {
                        ForEach(0..<pages.count, id: \.self) { index in
                            Capsule()
                                .fill(index == currentPage ? Color.duTabAccent : Color.gray.opacity(0.3))
                                .frame(width: index == currentPage ? 24 : 8, height: 8)
                                .scaleEffect(index == currentPage ? 1.0 : 0.85)
                                .animation(DuTheme.snappySpring, value: currentPage)
                        }
                    }

                    // CTA Button
                    Button {
                        HapticManager.impact(.medium)
                        if currentPage < pages.count - 1 {
                            withAnimation(DuTheme.defaultSpring) {
                                currentPage += 1
                            }
                        } else {
                            showSignIn = true
                        }
                    } label: {
                        Text(currentPage == pages.count - 1 ? "Começar" : "Próximo")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.duTabAccent, in: Capsule())
                            .contentTransition(.interpolate)
                    }
                    .pressableStyle()
                    .padding(.horizontal, 32)
                }
                .opacity(controlsAppeared ? 1 : 0)
                .scaleEffect(controlsAppeared ? 1.0 : 0.92)
                .animation(DuTheme.gentleSpring.delay(0.7), value: controlsAppeared)
                .padding(.bottom, 48)
            }
        }
        .onAppear {
            controlsAppeared = true
        }
        .sheet(isPresented: $showSignIn) {
            AuthView()
        }
        .onChange(of: Clerk.shared.user != nil) { _, isSignedIn in
            if isSignedIn {
                onComplete()
            }
        }
    }
}
