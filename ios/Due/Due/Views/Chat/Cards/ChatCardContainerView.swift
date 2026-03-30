import SwiftUI

struct ChatCardContainerView: View {
    let cards: [ChatCard]
    let onAction: (CardAction) -> Void

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: 8) {
            ForEach(Array(cards.enumerated()), id: \.element.id) { index, card in
                cardView(for: card)
                    .background(glassBackground, in: RoundedRectangle(cornerRadius: DuTheme.radiusMedium))
                    .transition(.asymmetric(
                        insertion: .opacity.combined(with: .move(edge: .bottom)).combined(with: .scale(scale: 0.95)),
                        removal: .opacity
                    ))
                    .animation(
                        DuTheme.defaultSpring.delay(Double(index) * 0.08),
                        value: cards.count
                    )
            }
        }
    }

    // MARK: - Card Routing

    @ViewBuilder
    private func cardView(for card: ChatCard) -> some View {
        switch card {
        case .budget(let data):
            BudgetCardView(card: data)
        case .installmentTimeline(let data):
            InstallmentTimelineCardView(card: data)
        case .transactionList(let data):
            TransactionListCardView(card: data)
        case .action(let data):
            ActionCardView(card: data, onAction: onAction)
        case .summary(let data):
            ChatSummaryCardView(card: data)
        }
    }

    // MARK: - Glass Background

    private var glassBackground: some ShapeStyle {
        Color(
            light: Color(.systemBackground).opacity(0.7),
            dark: Color.violet500.opacity(0.15)
        )
    }
}
