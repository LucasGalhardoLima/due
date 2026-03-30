import SwiftUI

struct BudgetCardView: View {
    let card: BudgetCard

    @Environment(\.colorScheme) private var colorScheme

    private var severityColor: Color {
        switch card.severity {
        case .ok: .statusSuccess
        case .warning: .statusWarning
        case .danger: .statusDanger
        }
    }

    private var percentageText: String {
        let pct = min(card.progress * 100, 999)
        return String(format: "%.0f%%", pct)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Header: category + severity dot
            HStack(spacing: 6) {
                Circle()
                    .fill(severityColor)
                    .frame(width: 8, height: 8)

                Text(card.categoryName)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)

                Spacer()

                Text(percentageText)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(severityColor)
            }

            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(light: .mint100, dark: .violet400.opacity(0.3)))
                        .frame(height: 8)

                    RoundedRectangle(cornerRadius: 4)
                        .fill(severityColor)
                        .frame(width: max(0, geo.size.width * min(CGFloat(card.progress), 1.0)), height: 8)
                }
            }
            .frame(height: 8)

            // Amount row
            HStack {
                Text(CurrencyFormatter.format(card.actual))
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.secondary)

                Text("de")
                    .font(.caption)
                    .foregroundStyle(.tertiary)

                Text(CurrencyFormatter.format(card.limit))
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.secondary)
            }

            // Summary
            Text(card.summary)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)
        }
        .padding(14)
    }
}
