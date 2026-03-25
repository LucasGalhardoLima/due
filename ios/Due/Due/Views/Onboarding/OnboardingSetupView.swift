import SwiftUI

struct OnboardingSetupView: View {
    let onComplete: () -> Void

    @State private var currentStep = 0
    @State private var isLoading = true
    @State private var error: String?

    // Card form
    @State private var cardName = ""
    @State private var cardLimit = ""
    @State private var closingDay = 25
    @State private var dueDay = 1

    // Income form
    @State private var incomeDescription = "Salário"
    @State private var incomeAmount = ""

    @State private var isSaving = false

    @Environment(\.colorScheme) private var colorScheme

    private let api = APIClient.shared
    private let totalSteps = 3 // 0: seed categories, 1: card, 2: income

    var body: some View {
        ZStack {
            DuTheme.onboardingGradient(for: colorScheme)
                .ignoresSafeArea()

            if isLoading {
                ProgressView()
                    .tint(.duTabAccent)
            } else {
                VStack(spacing: 0) {
                    // Progress
                    progressBar
                        .padding(.horizontal, 24)
                        .padding(.top, 12)

                    // Content
                    TabView(selection: $currentStep) {
                        cardStep.tag(1)
                        incomeStep.tag(2)
                    }
                    .tabViewStyle(.page(indexDisplayMode: .never))
                    .animation(DuTheme.defaultSpring, value: currentStep)
                }
            }
        }
        .task {
            await loadOnboardingState()
        }
    }

    // MARK: - Progress Bar

    private var progressBar: some View {
        HStack(spacing: 6) {
            ForEach(1...2, id: \.self) { step in
                Capsule()
                    .fill(step <= currentStep ? Color.duTabAccent : Color.gray.opacity(0.3))
                    .frame(height: 4)
                    .animation(DuTheme.snappySpring, value: currentStep)
            }
        }
    }

    // MARK: - Card Setup Step

    private var cardStep: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 20)

                Text("💳")
                    .font(.system(size: 56))

                VStack(spacing: 8) {
                    Text("Adicione seu cartão")
                        .font(.title2.bold())
                    Text("Comece com seu cartão principal. Você pode adicionar mais depois.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 24)

                VStack(spacing: 16) {
                    formField("Nome do cartão", text: $cardName, placeholder: "Ex: Nubank")

                    formField("Limite", text: $cardLimit, placeholder: "Ex: 5000", keyboard: .decimalPad)

                    HStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Dia de fechamento")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Stepper("\(closingDay)", value: $closingDay, in: 1...31)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: DuTheme.radiusMedium))
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Dia de vencimento")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Stepper("\(dueDay)", value: $dueDay, in: 1...31)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: DuTheme.radiusMedium))
                        }
                    }
                }
                .padding(.horizontal, 24)

                Spacer().frame(height: 8)

                // Buttons
                VStack(spacing: 12) {
                    Button {
                        Task { await saveCard() }
                    } label: {
                        HStack {
                            if isSaving {
                                ProgressView().tint(.white)
                            }
                            Text("Continuar")
                        }
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(cardFormValid ? Color.duTabAccent : Color.gray.opacity(0.4), in: Capsule())
                    }
                    .disabled(!cardFormValid || isSaving)
                    .pressableStyle()

                    Button("Pular por agora") {
                        HapticManager.selection()
                        Task { await skipToStep(2) }
                    }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 48)

                if let error {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 24)
                }
            }
        }
    }

    // MARK: - Income Setup Step

    private var incomeStep: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 20)

                Text("💰")
                    .font(.system(size: 56))

                VStack(spacing: 8) {
                    Text("Sua renda mensal")
                        .font(.title2.bold())
                    Text("Ajuda o Du a calcular quanto sobra no mês.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 24)

                VStack(spacing: 16) {
                    formField("Descrição", text: $incomeDescription, placeholder: "Ex: Salário")

                    formField("Valor mensal", text: $incomeAmount, placeholder: "Ex: 5000", keyboard: .decimalPad)
                }
                .padding(.horizontal, 24)

                Spacer().frame(height: 8)

                VStack(spacing: 12) {
                    Button {
                        Task { await saveIncome() }
                    } label: {
                        HStack {
                            if isSaving {
                                ProgressView().tint(.white)
                            }
                            Text("Concluir")
                        }
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(incomeFormValid ? Color.duTabAccent : Color.gray.opacity(0.4), in: Capsule())
                    }
                    .disabled(!incomeFormValid || isSaving)
                    .pressableStyle()

                    Button("Pular por agora") {
                        HapticManager.selection()
                        Task { await completeOnboarding() }
                    }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 48)

                if let error {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 24)
                }
            }
        }
    }

    // MARK: - Form Field Helper

    private func formField(_ label: String, text: Binding<String>, placeholder: String, keyboard: UIKeyboardType = .default) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            TextField(placeholder, text: text)
                .keyboardType(keyboard)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: DuTheme.radiusMedium))
        }
    }

    // MARK: - Validation

    private var cardFormValid: Bool {
        !cardName.isEmpty && parsedCardLimit > 0
    }

    private var incomeFormValid: Bool {
        !incomeDescription.isEmpty && parsedIncomeAmount > 0
    }

    private var parsedCardLimit: Double {
        Double(cardLimit.replacingOccurrences(of: ",", with: ".")) ?? 0
    }

    private var parsedIncomeAmount: Double {
        Double(incomeAmount.replacingOccurrences(of: ",", with: ".")) ?? 0
    }

    // MARK: - API Actions

    private func loadOnboardingState() async {
        do {
            // Seed categories silently
            let _: SeedCategoriesResponse = try await api.request(.seedCategories())

            // Check where user left off
            let status: OnboardingStatus = try await api.request(.onboardingStatus())
            if status.isCompleted {
                onComplete()
                return
            }

            // Resume from saved step (0 = start, map to UI step)
            let resumeStep = max(status.step, 1)
            currentStep = min(resumeStep, 2)
        } catch {
            // On error, start from step 1
            currentStep = 1
        }
        isLoading = false
    }

    private func saveCard() async {
        isSaving = true
        error = nil

        let request = CreateCardRequest(
            name: cardName,
            limit: parsedCardLimit,
            closingDay: closingDay,
            dueDay: dueDay
        )

        do {
            let _: Card = try await api.request(.createCard(), body: request)
            HapticManager.notification(.success)
            await persistStep(2)
            withAnimation(DuTheme.defaultSpring) {
                currentStep = 2
            }
        } catch {
            self.error = "Erro ao salvar cartão. Tente novamente."
            HapticManager.notification(.error)
        }

        isSaving = false
    }

    private func saveIncome() async {
        isSaving = true
        error = nil

        let now = Date()
        let month = Calendar.current.component(.month, from: now)
        let year = Calendar.current.component(.year, from: now)

        let request = CreateIncomeRequest(
            description: incomeDescription,
            amount: parsedIncomeAmount,
            isRecurring: true,
            month: month,
            year: year
        )

        do {
            struct IncomeResponse: Decodable { let id: String }
            let _: IncomeResponse = try await api.request(.createIncome(), body: request)
            HapticManager.notification(.success)
            await completeOnboarding()
        } catch {
            self.error = "Erro ao salvar renda. Tente novamente."
            HapticManager.notification(.error)
        }

        isSaving = false
    }

    private func skipToStep(_ step: Int) async {
        await persistStep(step)
        withAnimation(DuTheme.defaultSpring) {
            currentStep = step
        }
    }

    private func persistStep(_ step: Int) async {
        let update = OnboardingStepUpdate.step(step)
        let _: EmptyOkResponse? = try? await api.request(.updateOnboardingStep(), body: update)
    }

    private func completeOnboarding() async {
        let update = OnboardingStepUpdate.complete()
        let _: EmptyOkResponse? = try? await api.request(.updateOnboardingStep(), body: update)
        HapticManager.notification(.success)
        onComplete()
    }
}

private struct EmptyOkResponse: Decodable {
    let ok: Bool
}
