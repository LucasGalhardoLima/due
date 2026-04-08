import SwiftUI

struct TransactionListCardView: View {
    let card: TransactionListCard

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            ForEach(card.transactions) { tx in
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(tx.description)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.primary)
                            .lineLimit(1)

                        Text("\(tx.date) · \(tx.category)")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }

                    Spacer()

                    Text(CurrencyFormatter.format(tx.amount))
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                }
                .padding(.vertical, 4)

                if tx.id != card.transactions.last?.id {
                    Divider()
                }
            }
        }
        .padding(14)
    }
}
