import SwiftUI

struct UpcomingBillRow: View {
    let bill: UpcomingBill

    var body: some View {
        HStack(spacing: 12) {
            // Rounded bar indicator (replaces circle)
            RoundedRectangle(cornerRadius: 2)
                .fill(categoryColor)
                .frame(width: 4, height: 32)

            VStack(alignment: .leading, spacing: 2) {
                Text(bill.description)
                    .font(.subheadline.weight(.medium))
                    .lineLimit(1)

                HStack(spacing: 6) {
                    Text(bill.categoryName)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if let label = bill.installmentLabel {
                        Text(label)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.gray.opacity(0.15), in: Capsule())
                    }

                    if bill.isSubscription {
                        Image(systemName: "repeat")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(CurrencyFormatter.format(bill.amount))
                    .font(.subheadline.weight(.semibold))

                if let daysRemaining = daysUntilDue {
                    Text("em \(daysRemaining)d")
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(daysRemaining <= 3 ? Color.statusDanger : .secondary)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(
                            (daysRemaining <= 3 ? Color.statusDanger : Color.gray).opacity(0.1),
                            in: Capsule()
                        )
                } else if let date = bill.dueDateParsed {
                    Text(DateFormatters.dayMonth.string(from: date))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(12)
        .duGlass()
    }

    private var categoryColor: Color {
        if let hex = bill.categoryColor {
            return Color(hex: hex)
        }
        return .gray
    }

    private var daysUntilDue: Int? {
        guard let date = bill.dueDateParsed else { return nil }
        let days = Calendar.current.dateComponents([.day], from: Calendar.current.startOfDay(for: Date()), to: Calendar.current.startOfDay(for: date)).day
        guard let days, days >= 0 else { return nil }
        return days
    }
}

// MARK: - Hex Color Init

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: Double
        switch hex.count {
        case 6:
            r = Double((int >> 16) & 0xFF) / 255
            g = Double((int >> 8) & 0xFF) / 255
            b = Double(int & 0xFF) / 255
        default:
            r = 0; g = 0; b = 0
        }
        self.init(red: r, green: g, blue: b)
    }
}
