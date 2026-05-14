import Testing
import Foundation
@testable import Du

@MainActor
struct OverviewViewModelTests {
    private static let isoFmt: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    private func date(_ iso: String) -> Date {
        guard let d = Self.isoFmt.date(from: iso) else { fatalError("Bad ISO \(iso)") }
        return d
    }

    @Test
    func emptyStoreProducesSixZeroMonthsAndZeroTotal() {
        let result = OverviewViewModel.project(
            now: date("2026-05-14T12:00:00Z"),
            transactions: []
        )
        #expect(result.months.count == 6)
        #expect(result.totals.count == 6)
        #expect(result.totals.allSatisfy { $0 == 0 })
        #expect(result.totalSpent == 0)
        #expect(result.avgMonth == 0)
        // peakMonth still has a label so the "pior mês" stat doesn't render
        // as blank — defaults to the most recent month when there's a tie.
        #expect(result.months.last == result.peakMonth)
    }

    // Three months of varying spend should produce the right totals,
    // peakMonth (highest), and totalSpent (sum). Income transactions
    // must be excluded from the bars.
    @Test
    func transactionsAggregateIntoMonthlyTotals() {
        let now = date("2026-05-14T12:00:00Z")
        let txns: [Transaction] = [
            // March: -100, -50 = -150 spent (150 total)
            Transaction(merchant: "A", amount: -100, category: "X", timestamp: date("2026-03-05T10:00:00Z")),
            Transaction(merchant: "B", amount: -50,  category: "X", timestamp: date("2026-03-20T10:00:00Z")),
            // April: -300 spent + an income (should be ignored)
            Transaction(merchant: "C", amount: -300, category: "X", timestamp: date("2026-04-10T10:00:00Z")),
            Transaction(merchant: "Salário", amount: 5_000, category: "Renda", timestamp: date("2026-04-22T10:00:00Z")),
            // May (current): -200
            Transaction(merchant: "D", amount: -200, category: "X", timestamp: date("2026-05-12T10:00:00Z"))
        ]

        let result = OverviewViewModel.project(now: now, transactions: txns)

        #expect(result.totals.count == 6)
        // months are "out", "nov", "dez", "jan", "fev", "mar" => wait,
        // those are 6 months back from May: dez/jan/fev/mar/abr/mai
        // (oldest first). Index 3 = março = 150, index 4 = abril = 300,
        // index 5 = maio = 200.
        #expect(result.totals[0] == 0)
        #expect(result.totals[1] == 0)
        #expect(result.totals[2] == 0)
        #expect(result.totals[3] == 150)
        #expect(result.totals[4] == 300)
        #expect(result.totals[5] == 200)

        #expect(result.totalSpent == 650)
        // Highest single-month spend is April (300).
        #expect(result.peakMonth == result.months[4])
    }

    // Transactions outside the 6-month window must be ignored. A spend
    // from 12 months ago shouldn't show up in any bar.
    @Test
    func transactionsBeforeWindowAreExcluded() {
        let now = date("2026-05-14T12:00:00Z")
        let txns: [Transaction] = [
            Transaction(merchant: "Old", amount: -10_000, category: "X",
                        timestamp: date("2025-05-10T10:00:00Z")),
            Transaction(merchant: "New", amount: -42, category: "X",
                        timestamp: date("2026-05-10T10:00:00Z"))
        ]

        let result = OverviewViewModel.project(now: now, transactions: txns)
        #expect(result.totals.reduce(0, +) == 42)
        #expect(result.totalSpent == 42)
    }

    // The editorial sections are intentionally still mocked. This is a
    // load-bearing contract — when habit-detection ships, this test
    // must update too so it doesn't quietly mask a regression in the
    // mock fallback.
    @Test
    func habitsAndEconomyStillSourcedFromMockUntilDetectionShips() {
        let result = OverviewViewModel.project(
            now: date("2026-05-14T12:00:00Z"),
            transactions: []
        )
        #expect(result.habits.count == MockData.overview.habits.count)
        #expect(result.economyPotential6mo == MockData.overview.economyPotential6mo)
    }
}
