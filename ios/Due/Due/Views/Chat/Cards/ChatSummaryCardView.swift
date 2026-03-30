import SwiftUI

struct ChatSummaryCardView: View {
    let card: SummaryCard

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(card.title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)

            LazyVGrid(columns: columns, alignment: .leading, spacing: 10) {
                ForEach(card.pairs) { pair in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(pair.label)
                            .font(.caption2)
                            .foregroundStyle(.tertiary)

                        Text(pair.value)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.primary)
                    }
                }
            }
        }
        .padding(14)
    }
}
