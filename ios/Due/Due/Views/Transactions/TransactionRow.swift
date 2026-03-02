import SwiftUI

struct TransactionRow: View {
    let transaction: InvoiceTransaction

    var body: some View {
        HStack(spacing: 12) {
            // Category initial circle
            Circle()
                .fill(Color.duVioletAdaptive.opacity(0.12))
                .frame(width: 36, height: 36)
                .overlay {
                    Text(categoryInitial)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.duVioletAdaptive)
                }

            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.description)
                    .font(.subheadline.weight(.medium))
                    .lineLimit(1)

                HStack(spacing: 6) {
                    Text(transaction.category)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if transaction.totalInstallments > 1 {
                        Text("\(transaction.installmentNumber)/\(transaction.totalInstallments)")
                            .font(.caption2.weight(.medium))
                            .foregroundStyle(Color.duVioletAdaptive)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.duVioletAdaptive.opacity(0.1), in: Capsule())
                    }
                }
            }

            Spacer()

            Text(CurrencyFormatter.format(transaction.amount))
                .font(.subheadline.weight(.semibold))
        }
        .padding(.vertical, 4)
    }

    private var categoryInitial: String {
        let name = transaction.category
        guard let first = name.first else { return "?" }
        return String(first).uppercased()
    }
}
