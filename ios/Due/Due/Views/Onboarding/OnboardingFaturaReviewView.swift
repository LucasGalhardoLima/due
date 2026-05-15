import SwiftUI

struct OnboardingFaturaReviewView: View {
    @Environment(AppTheme.self) private var theme

    let fatura: ParsedFatura
    let card: OnboardingFaturaImportView.CardDraft
    var onConfirm: () -> Void
    var onBack: () -> Void

    private var total: Decimal {
        fatura.transactions.reduce(Decimal(0)) { $0 + $1.amount }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Revisa antes de salvar")
                .font(DuFont.mono(13, weight: .medium))
                .tracking(2.0)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)

            Text("\(fatura.stats.newPurchases) lançamentos.")
                .font(DuFont.mono(30, weight: .bold))
                .kerning(-0.6)
                .foregroundStyle(Color.duFg)
                .padding(.top, 16)

            Text("\(card.name) · total \(CurrencyFormatter.format(total))")
                .font(DuFont.mono(13))
                .foregroundStyle(Color.duFgMuted)
                .padding(.top, 6)

            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(Array(fatura.transactions.enumerated()), id: \.offset) { _, tx in
                        row(tx)
                    }
                }
            }
            .padding(.top, 20)

            if fatura.stats.skippedOngoing > 0 {
                HStack(spacing: 10) {
                    Image(systemName: "info.circle")
                        .foregroundStyle(Color.duFgMuted)
                    Text("\(fatura.stats.skippedOngoing) parcelas em andamento foram ignoradas (já estão nas faturas anteriores).")
                        .font(DuFont.mono(11))
                        .lineSpacing(2)
                        .foregroundStyle(Color.duFgMuted)
                }
                .padding(.horizontal, 14).padding(.vertical, 12)
                .background(Color.duSurface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .padding(.top, 12)
            }

            VStack(spacing: 12) {
                Button {
                    HapticManager.impact(.medium)
                    onConfirm()
                } label: {
                    OnboardingPrimaryButton(title: "Confirmar e importar", enabled: true)
                }
                .buttonStyle(.pressable)

                Button {
                    HapticManager.impact(.light)
                    onBack()
                } label: {
                    OnboardingSecondaryButton(title: "Voltar")
                }
                .buttonStyle(.pressable)
            }
            .padding(.top, 16)
        }
    }

    private func row(_ tx: ParsedTransaction) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(tx.rawDescription)
                    .font(DuFont.mono(13, weight: .medium))
                    .foregroundStyle(Color.duFg)
                    .lineLimit(1)
                HStack(spacing: 6) {
                    Text(tx.bankCategory.isEmpty ? "Outros" : tx.bankCategory.capitalized)
                    Text("·")
                    Text(displayDate(tx.purchaseDate))
                    if tx.installmentsCount > 1 {
                        Text("·")
                        Text("\(tx.installmentsCount)x")
                    }
                }
                .font(DuFont.mono(11))
                .foregroundStyle(Color.duFgMuted)
            }
            Spacer()
            Text(CurrencyFormatter.format(tx.amount))
                .font(DuFont.mono(13, weight: .medium))
                .foregroundStyle(Color.duFg)
        }
        .padding(.vertical, 12)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Color.duBorder).frame(height: 0.5)
        }
    }

    private func displayDate(_ iso: String) -> String {
        guard let date = DateFormatters.parseISO(iso) else { return iso }
        return DateFormatters.dayMonth.string(from: date)
    }
}
