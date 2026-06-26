import SwiftUI

struct ChatBubbleRow: View {
    let message: ChatMessage
    let palette: DuPalette
    var onSuggestion: (String) -> Void
    var onConfirmExpense: () -> Void
    var onEditExpense: () -> Void
    var onInsightAction: (AppDestination?) -> Void

    var body: some View {
        switch message.content {
        case .typing:
            HStack { TypingIndicator(); Spacer() }

        case .text(let text):
            HStack {
                if message.who == .me { Spacer() }
                TextBubble(text: text, isMe: message.who == .me, palette: palette)
                if message.who == .du { Spacer() }
            }

        case .suggestions(let chips):
            VStack(alignment: .leading, spacing: 6) {
                ForEach(chips, id: \.self) { chip in
                    Button {
                        HapticManager.impact(.light)
                        onSuggestion(chip)
                    } label: {
                        Text(chip)
                            .font(DuFont.mono(13))
                            .foregroundStyle(Color.duFg)
                            .padding(.horizontal, 16).padding(.vertical, 9)
                            .background(Color.clear)
                            .overlay(Capsule().stroke(Color.duBorder, lineWidth: 1))
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.pressable)
                    .accessibilityHint("Toca para enviar")
                }
            }

        case .expense(let proposal):
            HStack {
                ExpenseCard(
                    proposal: proposal,
                    confirmed: message.confirmed,
                    palette: palette,
                    onConfirm: onConfirmExpense,
                    onEdit: onEditExpense
                )
                Spacer(minLength: 0)
            }

        case .insight(let insight):
            HStack {
                InsightCard(insight: insight, palette: palette, onAction: { onInsightAction(insight.navigateTo) })
                Spacer(minLength: 0)
            }
        }
    }
}

// MARK: - Pieces

private struct TextBubble: View {
    let text: String
    let isMe: Bool
    let palette: DuPalette

    var body: some View {
        Text(text)
            .font(DuFont.mono(14))
            .foregroundStyle(isMe ? .white : Color.duFg)
            .lineSpacing(2)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(isMe ? AnyShapeStyle(palette.primary) : AnyShapeStyle(Color.duSurface),
                        in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(isMe ? Color.clear : Color.duBorder, lineWidth: 1)
            )
            .frame(maxWidth: 280, alignment: isMe ? .trailing : .leading)
            .accessibilityElement(children: .combine)
            .accessibilityLabel(isMe ? "Você: \(text)" : "Du: \(text)")
    }
}

private struct TypingIndicator: View {
    @State private var phase = 0
    @State private var animationTask: Task<Void, Never>?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .fill(Color.duFgMuted)
                    .frame(width: 8, height: 8)
                    .opacity(phase == i ? 1.0 : 0.35)
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(Color.duSurface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .accessibilityLabel("Du está digitando")
        .accessibilityAddTraits(.updatesFrequently)
        .onAppear {
            guard !reduceMotion else { return }
            animationTask = Task { @MainActor in
                while !Task.isCancelled {
                    try? await Task.sleep(for: .milliseconds(180))
                    guard !Task.isCancelled else { return }
                    withAnimation(.easeInOut(duration: 0.12)) { phase = (phase + 1) % 3 }
                }
            }
        }
        .onDisappear { animationTask?.cancel() }
    }
}

private struct ExpenseCard: View {
    let proposal: ExpenseProposal
    let confirmed: Bool
    let palette: DuPalette
    var onConfirm: () -> Void
    var onEdit: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(proposal.category)
                        .font(DuFont.mono(11, weight: .medium))
                        .tracking(2.0)
                        .textCase(.uppercase)
                        .foregroundStyle(Color.duFgMuted)
                    Text(proposal.merchant)
                        .font(DuFont.display(16, weight: .semibold))
                        .foregroundStyle(Color.duFg)
                        .kerning(-0.2)
                }
                Spacer()
                Text(CurrencyFormatter.format(proposal.amount))
                    .font(DuFont.mono(22, weight: .bold))
                    .kerning(-0.5)
                    .foregroundStyle(Color.duFg)
                    .minimumScaleFactor(0.8)
                    .lineLimit(1)
            }

            Text("\(proposal.date) · \(proposal.time)")
                .font(DuFont.mono(11, weight: .medium))
                .tracking(1.5)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgFaint)

            if confirmed {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(palette.primary)
                    Text("Adicionado ao mês")
                        .font(DuFont.mono(13, weight: .medium))
                        .foregroundStyle(palette.primary)
                }
                .padding(.top, 8)
                .frame(maxWidth: .infinity, alignment: .leading)
                .overlay(alignment: .top) {
                    Rectangle().fill(Color.duBorder).frame(height: 1)
                }
            } else {
                HStack(spacing: 8) {
                    Button {
                        HapticManager.notification(.success)
                        onConfirm()
                    } label: {
                        Text("Confirmar")
                            .font(DuFont.mono(13, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10).padding(.horizontal, 14)
                            .background(palette.primary, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.pressable)
                    .accessibilityLabel("Confirmar \(proposal.merchant)")

                    Button(action: onEdit) {
                        Text("Editar")
                            .font(DuFont.mono(13, weight: .medium))
                            .foregroundStyle(Color.duFg)
                            .padding(.vertical, 10).padding(.horizontal, 14)
                            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(Color.duBorder, lineWidth: 1))
                    }
                    .buttonStyle(.pressable)
                }
                .padding(.top, 4)
            }
        }
        .padding(.horizontal, 18).padding(.vertical, 16)
        .background(Color.duSurface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(Color.duBorder, lineWidth: 1))
        .frame(maxWidth: 320)
    }
}

private struct InsightCard: View {
    let insight: ChatInsight
    let palette: DuPalette
    var onAction: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            DuSparkle(size: 12, color: palette.primary)
                .padding(.top, 3)

            VStack(alignment: .leading, spacing: 4) {
                Text(insight.title)
                    .font(DuFont.display(14, weight: .semibold))
                    .lineSpacing(1)
                    .foregroundStyle(Color.duFg)
                Text(insight.body)
                    .font(DuFont.mono(13))
                    .lineSpacing(1)
                    .foregroundStyle(Color.duFgMuted)
                if let action = insight.action {
                    Button(action: onAction) {
                        Text("\(action) →")
                            .font(DuFont.mono(12, weight: .semibold))
                            .foregroundStyle(palette.primary)
                            .frame(minHeight: 44, alignment: .leading)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.pressable)
                    .padding(.top, 4)
                    .accessibilityLabel(action)
                }
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 14)
        .background(Color.duSurface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(Color.duBorder, lineWidth: 1))
        .frame(maxWidth: 320, alignment: .leading)
    }
}
