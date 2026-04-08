import SwiftUI

struct ChatInputBar: View {
    @Binding var text: String
    let isStreaming: Bool
    let onSend: () -> Void

    @FocusState private var isFocused: Bool

    private var canSend: Bool {
        !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isStreaming
    }

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            TextField("Pergunte algo...", text: $text, axis: .vertical)
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
