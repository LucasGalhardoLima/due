import SwiftUI

struct ExpenseConfirmationBubble: View {
    let expense: ParsedExpense
    let onConfirm: () async -> Void
    let onEdit: () -> Void
    let onUndo: (() async -> Void)?

    @State private var isConfirmed = false
    @State private var showUndoWindow = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if isConfirmed {
                confirmedView
            } else {
                confirmationView
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: DuTheme.radiusMedium)
                .fill(Color(.systemBackground).opacity(0.5))
        )
        .overlay(
            RoundedRectangle(cornerRadius: DuTheme.radiusMedium)
                .stroke(Color.duVioletAdaptive.opacity(0.3), lineWidth: 1)
        )
        .padding(.horizontal, 16)
    }

    // MARK: - Confirmation View

    private var confirmationView: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Color.statusSuccess)
                    .font(.title3)

                Text("Gasto identificado")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.secondary)
            }

            Divider()

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(expense.displayAmount)
                        .font(.title2.weight(.bold))
                        .foregroundStyle(Color.duVioletAdaptive)

                    Spacer()

                    if let categoryId = expense.categoryId {
                        categoryBadge(categoryId)
                    }
                }

                Text(expense.description)
                    .font(.body)
                    .foregroundStyle(.primary)

                Text(formatDate(expense.date))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Divider()

            HStack(spacing: 12) {
                Button {
                    HapticManager.impact(.light)
                    onEdit()
                } label: {
                    Text("Editar")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: DuTheme.radiusSmall)
                                .fill(Color(.systemGray5))
                        )
                }

                Button {
                    HapticManager.impact(.medium)
                    Task {
                        await confirmExpense()
                    }
                } label: {
                    Text("Confirmar")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: DuTheme.radiusSmall)
                                .fill(Color.duVioletAdaptive)
                        )
                }
            }
        }
    }

    // MARK: - Confirmed View

    private var confirmedView: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Color.statusSuccess)
                    .font(.title3)

                Text("Pronto! \(expense.description) \(expense.displayAmount) adicionado.")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.primary)
            }

            if showUndoWindow, let onUndo {
                Button {
                    HapticManager.impact(.light)
                    Task {
                        await onUndo()
                        showUndoWindow = false
                    }
                } label: {
                    Text("Desfazer")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(Color.duVioletAdaptive)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(
                            RoundedRectangle(cornerRadius: DuTheme.radiusSmall)
                                .fill(Color.duVioletAdaptive.opacity(0.1))
                        )
                }
            }
        }
    }

    // MARK: - Helpers

    private func categoryBadge(_ categoryId: String) -> some View {
        Text("📦")
            .font(.caption)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                Capsule()
                    .fill(Color(.systemGray6))
            )
    }

    private func formatDate(_ dateString: String) -> String {
        let inputFormatter = ISO8601DateFormatter()
        inputFormatter.formatOptions = [.withFullDate]

        guard let date = inputFormatter.date(from: dateString) else {
            return dateString
        }

        let outputFormatter = DateFormatter()
        outputFormatter.dateFormat = "d 'de' MMMM"
        outputFormatter.locale = Locale(identifier: "pt_BR")

        return outputFormatter.string(from: date)
    }

    private func confirmExpense() async {
        await onConfirm()
        isConfirmed = true
        showUndoWindow = true

        // Hide undo button after 5 seconds
        try? await Task.sleep(for: .seconds(5))
        showUndoWindow = false
    }
}
