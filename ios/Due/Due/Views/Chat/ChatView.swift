import SwiftUI

struct ChatView: View {
    @State private var viewModel = ChatViewModel()
    @State private var inputText = ""
    @FocusState private var isInputFocused: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                messageList

                if !viewModel.hasMessages {
                    suggestionChips
                        .padding(.bottom, 8)
                }

                ChatInputBar(
                    text: $inputText,
                    isStreaming: viewModel.isStreaming,
                    onSend: sendMessage
                )
            }
            .duNavigationGlass()
            .duGradientBackground()
            .navigationTitle("Chat")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    if viewModel.hasMessages {
                        Button {
                            HapticManager.impact(.light)
                            withAnimation(DuTheme.defaultSpring) {
                                viewModel.clearChat()
                            }
                        } label: {
                            Image(systemName: "trash")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Message List

    private var messageList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                if viewModel.hasMessages {
                    LazyVStack(spacing: 12) {
                        ForEach(Array(viewModel.messages.enumerated()), id: \.element.id) { index, message in
                            ChatBubbleView(
                                message: message,
                                isStreaming: viewModel.isStreaming && index == viewModel.messages.count - 1,
                                onCardAction: { action in
                                    Task { await viewModel.handleCardAction(action) }
                                },
                                onCardTap: { card in
                                    Task { await viewModel.handleCardTap(card) }
                                }
                            )
                            .id(message.id)
                            .staggeredAppearance(index: index)
                        }
                    }
                    .padding(.vertical, 16)
                } else {
                    emptyState
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .padding(.top, 80)
                }

                if let errorKind = viewModel.errorKind {
                    errorBanner(errorKind)
                        .padding(.horizontal, 16)
                        .padding(.bottom, 8)
                }
            }
            .scrollDismissesKeyboard(.interactively)
            .onChange(of: viewModel.messages.count) {
                scrollToBottom(proxy: proxy)
            }
            .onChange(of: viewModel.messages.last?.content) {
                scrollToBottom(proxy: proxy)
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color.mint300, Color.mint500],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 64, height: 64)
                Text("Du")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(.white)
            }

            VStack(spacing: 6) {
                Text("Converse com a Du")
                    .font(.title3.weight(.semibold))
                Text("Pergunte sobre seus gastos, orcamentos e parcelas")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.horizontal, 24)
    }

    // MARK: - Suggestion Chips

    private var suggestionChips: some View {
        SuggestionChipsView { suggestion in
            inputText = suggestion
            sendMessage()
        }
    }

    // MARK: - Error Banner

    private func errorBanner(_ kind: ErrorKind) -> some View {
        HStack(spacing: 8) {
            Image(systemName: kind.icon)
                .foregroundStyle(Color.statusDanger)
            Text(kind.message)
                .font(.caption)
                .foregroundStyle(.secondary)
            Spacer()
            Button("Tentar") {
                if let lastUserMessage = viewModel.messages.last(where: { $0.role == .user }) {
                    inputText = lastUserMessage.content
                    sendMessage()
                }
            }
            .font(.caption.weight(.medium))
            .foregroundStyle(Color.duVioletAdaptive)
        }
        .padding(12)
        .duGlass(in: RoundedRectangle(cornerRadius: DuTheme.radiusMedium))
    }

    // MARK: - Actions

    private func sendMessage() {
        let text = inputText
        inputText = ""
        Task {
            await viewModel.send(text)
        }
    }

    private func scrollToBottom(proxy: ScrollViewProxy) {
        guard let lastId = viewModel.messages.last?.id else { return }
        withAnimation(DuTheme.defaultSpring) {
            proxy.scrollTo(lastId, anchor: .bottom)
        }
    }
}
