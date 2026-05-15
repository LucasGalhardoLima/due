import SwiftUI

struct OnboardingCardSetupSheet: View {
    @Environment(AppTheme.self) private var theme

    let fatura: ParsedFatura
    var onConfirm: (OnboardingFaturaImportView.CardDraft) -> Void
    var onBack: () -> Void

    @State private var name: String
    @State private var limitText: String = ""
    @State private var closingDay: Int = 10
    @State private var dueDay: Int = 20

    init(
        fatura: ParsedFatura,
        onConfirm: @escaping (OnboardingFaturaImportView.CardDraft) -> Void,
        onBack: @escaping () -> Void
    ) {
        self.fatura = fatura
        self.onConfirm = onConfirm
        self.onBack = onBack
        _name = State(initialValue: fatura.bank == "itau" ? "Itaú" : fatura.bank.capitalized)
    }

    private var limitDecimal: Decimal? {
        let cleaned = limitText
            .replacingOccurrences(of: ".", with: "")
            .replacingOccurrences(of: ",", with: ".")
        guard let value = Decimal(string: cleaned), value > 0 else { return nil }
        return value
    }

    private var canContinue: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
            && limitDecimal != nil
            && (1...31).contains(closingDay)
            && (1...31).contains(dueDay)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Faltam só os números")
                .font(DuFont.mono(13, weight: .medium))
                .tracking(2.0)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)

            Text("O cartão.")
                .font(DuFont.mono(30, weight: .bold))
                .kerning(-0.6)
                .foregroundStyle(Color.duFg)
                .padding(.top, 16)

            Text("Pra eu organizar a fatura nos meses certos.")
                .font(DuFont.mono(14))
                .lineSpacing(2)
                .foregroundStyle(Color.duFgMuted)
                .padding(.top, 12)

            VStack(spacing: 16) {
                field(label: "Apelido", placeholder: "Itaú") {
                    TextField("", text: $name)
                        .textInputAutocapitalization(.words)
                        .font(DuFont.display(18, weight: .medium))
                        .foregroundStyle(Color.duFg)
                }
                field(label: "Limite (R$)", placeholder: "10.000,00") {
                    TextField("", text: $limitText)
                        .keyboardType(.decimalPad)
                        .font(DuFont.display(18, weight: .medium))
                        .foregroundStyle(Color.duFg)
                }
                HStack(spacing: 12) {
                    field(label: "Fechamento", placeholder: "dia") {
                        Stepper(value: $closingDay, in: 1...31) {
                            Text("dia \(closingDay)")
                                .font(DuFont.display(18, weight: .medium))
                                .foregroundStyle(Color.duFg)
                        }
                    }
                    field(label: "Vencimento", placeholder: "dia") {
                        Stepper(value: $dueDay, in: 1...31) {
                            Text("dia \(dueDay)")
                                .font(DuFont.display(18, weight: .medium))
                                .foregroundStyle(Color.duFg)
                        }
                    }
                }
            }
            .padding(.top, 24)

            Spacer(minLength: 24)

            VStack(spacing: 12) {
                Button {
                    guard canContinue, let limit = limitDecimal else { return }
                    HapticManager.impact(.light)
                    onConfirm(.init(
                        name: name.trimmingCharacters(in: .whitespaces),
                        limit: limit,
                        closingDay: closingDay,
                        dueDay: dueDay
                    ))
                } label: {
                    OnboardingPrimaryButton(title: "Continuar", enabled: canContinue)
                }
                .buttonStyle(.pressable)
                .disabled(!canContinue)

                Button {
                    HapticManager.impact(.light)
                    onBack()
                } label: {
                    OnboardingSecondaryButton(title: "Voltar")
                }
                .buttonStyle(.pressable)
            }
        }
    }

    private func field<Content: View>(
        label: String,
        placeholder: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(DuFont.mono(11, weight: .medium))
                .tracking(1.5)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)
            content()
                .padding(.horizontal, 14).padding(.vertical, 14)
                .background(Color.duSurface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.duBorder, lineWidth: 1)
                )
        }
    }
}
