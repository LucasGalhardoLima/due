import SwiftUI

struct ChatBubbleView: View {
    let message: Message
    let isStreaming: Bool
    var onCardAction: ((CardAction) -> Void)?

    @Environment(\.colorScheme) private var colorScheme

    private var isUser: Bool { message.role == .user }

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            if isUser { Spacer(minLength: 48) }

            if !isUser {
                duAvatar
            }

            VStack(alignment: isUser ? .trailing : .leading, spacing: 4) {
                bubbleContent
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(bubbleBackground, in: bubbleShape)

                // Inline cards for assistant messages
                if !isUser && !message.cards.isEmpty {
                    ChatCardContainerView(cards: message.cards) { action in
                        onCardAction?(action)
                    }
                    .padding(.top, 4)
                }

                Text(message.timestamp, style: .time)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }

            if !isUser { Spacer(minLength: 48) }
        }
        .padding(.horizontal, 16)
    }

    // MARK: - Bubble Content

    @ViewBuilder
    private var bubbleContent: some View {
        if message.content.isEmpty && isStreaming {
            TypingIndicatorView()
        } else {
            Text(message.content)
                .font(.body)
                .foregroundStyle(isUser ? .white : .primary)
                .textSelection(.enabled)
        }
    }

    // MARK: - Bubble Shape & Background

    private var bubbleShape: UnevenRoundedRectangle {
        UnevenRoundedRectangle(
            topLeadingRadius: isUser ? DuTheme.radiusMedium : 4,
            bottomLeadingRadius: DuTheme.radiusMedium,
            bottomTrailingRadius: DuTheme.radiusMedium,
            topTrailingRadius: isUser ? 4 : DuTheme.radiusMedium
        )
    }

    private var bubbleBackground: Color {
        isUser ? Color.duVioletAdaptive : Color(.systemBackground).opacity(0.6)
    }

    // MARK: - Du Avatar

    private var duAvatar: some View {
        ZStack {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [Color.mint300, Color.mint500],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            Text("Du")
                .font(.caption.weight(.bold))
                .foregroundStyle(.white)
        }
        .frame(width: 28, height: 28)
    }
}
