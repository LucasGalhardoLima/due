import SwiftUI

struct SummaryCardView: View {
    let label: String
    let value: Double
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)

            AnimatedCurrencyText(value: value)
                .font(.system(.title3, design: .rounded, weight: .bold))
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background {
            color.opacity(0.04)
                .clipShape(RoundedRectangle(cornerRadius: DuTheme.radiusLarge))
        }
        .duGlass()
    }
}
