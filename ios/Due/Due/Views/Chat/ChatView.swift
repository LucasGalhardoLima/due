import SwiftUI

struct ChatView: View {
    @State private var viewModel = ChatViewModel()
    @State private var inputText = ""
    @State private var isEditingExpense = false
    @FocusState private var isInputFocused: Bool

    let startInQuickAddMode: Bool

    init(startInQuickAddMode: Bool = false) {
        self.startInQuickAddMode = startInQuickAddMode
    }

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
                    placeholder: quickAddPlaceholder,
                    shouldFocus: viewModel.prefillMode == .quickAddExpense,
                    onSend: sendMessage
                )
            }
            .duNavigationGlass()
            .duGradientBackground()
            .navigationTitle("Chat")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                if startInQuickAddMode && viewModel.prefillMode == .normal {
                    viewModel.enterQuickAddMode()
                }
            }
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
                                }
                            )
                            .id(message.id)
                            .staggeredAppearance(index: index)
                        }

                        // Show expense confirmation bubble if there's a pending expense
                        if let expense = viewModel.pendingExpense, !isEditingExpense {
                            ExpenseConfirmationBubble(
                                expense: expense,
                                onConfirm: {
                                    await viewModel.saveExpense()
                                },
                                onEdit: {
                                    handleEditExpense()
                                },
                                onUndo: expense.transactionId != nil ? {
                                    await viewModel.undoExpense()
                                } : nil
                            )
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
            .onChange(of: viewModel.pendingExpense) {
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

    private func handleEditExpense() {
        guard let expense = viewModel.pendingExpense else { return }

        // Pre-fill input with expense details for editing
        inputText = "\(expense.description) R$\(Double(truncating: expense.amount as NSDecimalNumber)) \(formatDateForInput(expense.date))"
        isEditingExpense = true

        // Clear pending expense and re-enter quick-add mode
        viewModel.clearPendingExpense()
        viewModel.enterQuickAddMode()

        // Focus input
        isInputFocused = true
    }

    private func formatDateForInput(_ dateString: String) -> String {
        let inputFormatter = ISO8601DateFormatter()
        inputFormatter.formatOptions = [.withFullDate]

        guard let date = inputFormatter.date(from: dateString) else {
            return ""
        }

        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let expenseDate = calendar.startOfDay(for: date)

        let daysDifference = calendar.dateComponents([.day], from: expenseDate, to: today).day ?? 0

        if daysDifference == 0 {
            return "hoje"
        } else if daysDifference == 1 {
            return "ontem"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "dd/MM"
            return formatter.string(from: date)
        }
    }

    // MARK: - Computed Properties

    private var quickAddPlaceholder: String {
        viewModel.prefillMode == .quickAddExpense ? "Adiciona gasto: Uber R$25 ontem" : "Pergunte algo..."
    }
}
