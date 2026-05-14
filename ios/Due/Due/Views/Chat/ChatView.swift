import SwiftUI

struct ChatView: View {
    @Environment(AppTheme.self) private var theme
    @Bindable var viewModel: ChatViewModel
    var onBack: () -> Void

    @FocusState private var inputFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider().background(Color.duBorder)
            thread
            Divider().background(Color.duBorder)
            composer
        }
        .background(Color.duBg.ignoresSafeArea())
        .onAppear { inputFocused = true }
    }

    // MARK: Header

    private var header: some View {
        HStack(spacing: 12) {
            Button(action: onBack) {
                Image(systemName: "arrow.left")
                    .font(.system(size: 18, weight: .regular))
                    .foregroundStyle(Color.duFg)
                    .frame(width: 36, height: 36)
            }
            .buttonStyle(.pressable)

            Text("👋")
                .font(.system(size: 22))
                .frame(width: 28, height: 28)

            VStack(alignment: .leading, spacing: 1) {
                Text("Du")
                    .font(DuFont.display(14, weight: .semibold))
                    .kerning(-0.1)
                    .foregroundStyle(Color.duFg)
                Text("Coach financeiro")
                    .font(DuFont.mono(10, weight: .medium))
                    .tracking(2.0)
                    .textCase(.uppercase)
                    .foregroundStyle(Color.duFgFaint)
            }

            Spacer()
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
    }

    // MARK: Thread

    private var thread: some View {
        ScrollViewReader { proxy in
            ScrollView(.vertical, showsIndicators: false) {
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(viewModel.thread) { message in
                        ChatBubbleRow(
                            message: message,
                            palette: theme.palette,
                            onSuggestion: { viewModel.suggestionTapped($0) },
                            onConfirmExpense: { viewModel.confirmExpense(messageID: message.id) },
                            onEditExpense: { viewModel.editExpense(messageID: message.id) },
                            onInsightAction: { viewModel.insightActionTapped($0) }
                        )
                        .id(message.id)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 20)
            }
            .onChange(of: viewModel.thread.count) { _, _ in
                if let last = viewModel.thread.last {
                    withAnimation(.easeOut(duration: 0.25)) {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }
        }
    }

    // MARK: Composer

    private var composer: some View {
        @Bindable var vm = viewModel
        return HStack(spacing: 10) {
            Button { } label: {
                Image(systemName: "plus")
                    .font(.system(size: 16, weight: .regular))
                    .foregroundStyle(Color.duFgMuted)
                    .frame(width: 40, height: 40)
                    .overlay(Circle().stroke(Color.duBorder, lineWidth: 1))
            }
            .buttonStyle(.pressable)

            TextField(
                "",
                text: $vm.draft,
                prompt: Text("Tipo \"iFood 47\" ou pergunta…")
                    .foregroundStyle(Color.duFgMuted)
            )
            .focused($inputFocused)
            .font(DuFont.mono(14))
            .foregroundStyle(Color.duFg)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.duSurface)
            .overlay(Capsule().stroke(Color.duBorder, lineWidth: 1))
            .clipShape(Capsule())
            .submitLabel(.send)
            .onSubmit { viewModel.send() }

            Group {
                if !viewModel.draft.trimmingCharacters(in: .whitespaces).isEmpty {
                    Button {
                        HapticManager.impact(.light)
                        viewModel.send()
                    } label: {
                        Image(systemName: "paperplane.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: 40, height: 40)
                            .background(theme.palette.primary, in: Circle())
                    }
                    .buttonStyle(.pressable)
                } else {
                    Button { } label: {
                        Image(systemName: "mic")
                            .font(.system(size: 16, weight: .regular))
                            .foregroundStyle(Color.duFgMuted)
                            .frame(width: 40, height: 40)
                            .overlay(Circle().stroke(Color.duBorder, lineWidth: 1))
                    }
                    .buttonStyle(.pressable)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 18)
    }
}
