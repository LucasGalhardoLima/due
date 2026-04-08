import SwiftUI

struct InstallmentTimelineCardView: View {
    let card: InstallmentTimelineCard

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Parcelas futuras")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)

            ForEach(card.entries) { entry in
                HStack {
                    Text("\(entry.month) \(String(entry.year))")
                        .font(.subheadline)
                        .foregroundStyle(.primary)

                    Spacer()

                    Text(CurrencyFormatter.format(entry.amount))
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.primary)
                }
                .padding(.vertical, 2)
            }

            Divider()
                .padding(.vertical, 2)

            // Total row
            HStack {
                Text("Total comprometido")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)

                Spacer()

                Text(CurrencyFormatter.format(card.totalCommitted))
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(Color.duVioletAdaptive)
            }
        }
        .padding(14)
    }
}
