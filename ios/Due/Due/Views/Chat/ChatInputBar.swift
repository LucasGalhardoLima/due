import SwiftUI

struct ChatInputBar: View {
    @Binding var text: String
    let isStreaming: Bool
    let placeholder: String
    let shouldFocus: Bool
    let onSend: () -> Void

    @FocusState private var isFocused: Bool

    init(text: Binding<String>, isStreaming: Bool, placeholder: String = "Pergunte algo...", shouldFocus: Bool = false, onSend: @escaping () -> Void) {
        self._text = text
        self.isStreaming = isStreaming
        self.placeholder = placeholder
        self.shouldFocus = shouldFocus
        self.onSend = onSend
    }

    private var canSend: Bool {
        !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isStreaming
    }

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            TextField(placeholder, text: $text, axis: .vertical)
                .font(.body)
                .lineLimit(1...5)
                .focused($isFocused)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: DuTheme.radiusLarge)
                        .fill(Color(.systemBackground).opacity(0.5))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: DuTheme.radiusLarge)
                        .stroke(Color.violet200.opacity(0.2), lineWidth: 1)
                )
                .onSubmit {
                    if canSend { onSend() }
                }
                .onAppear {
                    if shouldFocus {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            isFocused = true
                        }
                    }
                }

            Button {
                HapticManager.impact(.light)
                onSend()
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(canSend ? Color.duVioletAdaptive : Color.secondary.opacity(0.3))
            }
            .disabled(!canSend)
            .pressableStyle()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }
}
