import SwiftUI

struct TopSpendingWidget: View {
    let categories: [BudgetSummary.CategorySpending]

    private var topCategories: [BudgetSummary.CategorySpending] {
        categories
            .sorted { $0.actualSpending > $1.actualSpending }
            .prefix(5)
            .map { $0 }
    }

    var body: some View {
        if !topCategories.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Text("Maiores gastos")
                    .font(.headline)
                    .padding(.horizontal, 4)

                VStack(spacing: 8) {
                    ForEach(Array(topCategories.enumerated()), id: \.element.id) { index, category in
                        NavigationLink {
                            TransactionDrilldownView(filter: .category(
                                id: category.categoryId,
                                name: category.categoryName,
                                emoji: category.categoryEmoji
                            ))
                        } label: {
                            HStack(spacing: 12) {
                                Text("\(index + 1)")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(rankColor(index))
                                    .frame(width: 20)

                                Text(category.categoryEmoji ?? "📦")
                                    .font(.callout)

                                Text(category.categoryName)
                                    .font(.subheadline.weight(.medium))
                                    .lineLimit(1)

                                Spacer()

                                Text(CurrencyFormatter.format(category.actualSpending))
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(rankColor(index))

                                Image(systemName: "chevron.right")
                                    .font(.caption2.weight(.semibold))
                                    .foregroundStyle(.tertiary)
                            }
                        }
                        .buttonStyle(.plain)
                        .padding(.vertical, 6)
                        .padding(.horizontal, 12)
                    }
                }
                .padding(.vertical, 8)
                .duGlass()
            }
        }
    }

    private func rankColor(_ index: Int) -> Color {
        switch index {
        case 0: return .statusDanger
        case 1: return .statusWarning
        default: return .secondary
        }
    }
}
