import Foundation

enum CurrencyFormatter: Sendable {
    private static let brlFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.locale = Locale(identifier: "pt_BR")
        f.currencyCode = "BRL"
        f.minimumFractionDigits = 2
        f.maximumFractionDigits = 2
        return f
    }()

    /// Full BRL format: "R$ 1.234,56"
    static func format(_ value: Double) -> String {
        brlFormatter.string(from: NSNumber(value: value)) ?? "R$ 0,00"
    }

    /// Compact BRL format: "R$ 1,2 mil", "R$ 1,5 mi"
    /// Falls back to full format for values under 1000.
    static func formatCompact(_ value: Double) -> String {
        let abs = Swift.abs(value)
        let sign = value < 0 ? "-" : ""

        if abs >= 1_000_000 {
            let millions = abs / 1_000_000
            let formatted = String(format: "%.1f", millions)
                .replacingOccurrences(of: ".", with: ",")
                .replacingOccurrences(of: ",0", with: "")
            return "\(sign)R$ \(formatted) mi"
        } else if abs >= 1_000 {
            let thousands = abs / 1_000
            let formatted = String(format: "%.1f", thousands)
                .replacingOccurrences(of: ".", with: ",")
                .replacingOccurrences(of: ",0", with: "")
            return "\(sign)R$ \(formatted) mil"
        } else {
            return format(value)
        }
    }
}
