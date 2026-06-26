import Foundation

// Projects raw Transactions into the OverviewData view contract. ONLY
// the chart aggregation (monthly totals, peakMonth, totalSpent) comes
// from real data — the `habits` section is editorial AI output that
// requires real pattern detection over the user's history (LLM call
// or hand-tuned heuristics), so it stays sourced from MockData until
// that pipeline lands. `economyPotential6mo` is a function of habits
// too, so it stays mocked alongside.
//
// The boundary is intentional: by the time habit-detection ships, we
// only need to touch the `habits` / `economyPotential6mo` lines below
// to flip the whole screen to live data.
@MainActor
enum OverviewViewModel {
    /// 6-month rolling window ending at `now`. Months without expenses
    /// render as zero-height bars; the chart layout assumes exactly 6.
    private static let monthsWindow = 6

    static func project(
        now: Date = .now,
        transactions: [Transaction]
    ) -> OverviewData {
        let cal = Calendar.current
        var months: [String] = []
        var totals: [Int] = []

        // Walk oldest → newest so the chart's natural left-to-right
        // reading order ("out → mar" in the header) matches array order.
        for offset in (1 - monthsWindow)...0 {
            guard let monthDate = cal.date(byAdding: .month, value: offset, to: now) else {
                months.append(""); totals.append(0); continue
            }
            let interval = cal.dateInterval(of: .month, for: monthDate)
                ?? DateInterval(start: monthDate, duration: 0)

            // Only expenses count toward "spend" — incoming salary etc.
            // shouldn't bloat the bar height. Sign-flip to positive.
            let sum = transactions
                .filter { $0.amount < 0 && interval.contains($0.timestamp) }
                .map { -$0.amount }
                .reduce(Decimal(0), +)

            totals.append(NSDecimalNumber(decimal: sum).intValue)
            months.append(monthLabel(for: monthDate))
        }

        let totalSpent = totals.reduce(0, +)
        // On a tie (notably an empty store where every month is 0) we
        // want the MOST RECENT max so "pior mês" doesn't surface a
        // 6-month-old label on a fresh app. `lastIndex(of:)` gives us
        // that bias for free.
        let maxTotal = totals.max() ?? 0
        let peakIdx = totals.lastIndex(of: maxTotal) ?? (totals.count - 1)
        let peakMonth = months.indices.contains(peakIdx) ? months[peakIdx] : ""

        return OverviewData(
            months: months,
            totals: totals,
            totalSpent: totalSpent,
            peakMonth: peakMonth,
            // Editorial sections — wait for habit-detection pipeline:
            economyPotential6mo: MockData.overview.economyPotential6mo,
            habits: MockData.overview.habits
        )
    }

    private static let monthLabelFmt: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "MMM"
        return f
    }()

    private static func monthLabel(for date: Date) -> String {
        monthLabelFmt
            .string(from: date)
            .replacingOccurrences(of: ".", with: "")
            .lowercased()
    }
}
