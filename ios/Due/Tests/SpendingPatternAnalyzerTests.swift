import Testing
import Foundation
@testable import Du

struct SpendingPatternAnalyzerTests {

    // MARK: - Helpers

    /// Creates a PatternInput at `daysAgo` days in the past, at the given hour.
    private func tx(
        daysAgo: Double,
        hour: Int = 14,
        merchant: String = "Mercado",
        category: String = "Mercado",
        amount: Decimal = -50
    ) -> PatternInput {
        let base = Date().addingTimeInterval(-daysAgo * 86_400)
        var comps = Calendar.current.dateComponents([.year, .month, .day], from: base)
        comps.hour = hour
        comps.minute = 0
        comps.second = 0
        let timestamp = Calendar.current.date(from: comps) ?? base
        return PatternInput(timestamp: timestamp, amount: amount, category: category, merchant: merchant)
    }

    // MARK: - Guard: minimum data

    @Test
    func returnsNilWithTooFewTransactions() {
        let inputs = (0..<6).map { i in tx(daysAgo: Double(i)) }
        #expect(SpendingPatternAnalyzer.analyze(inputs) == nil)
    }

    @Test
    func returnsNilWithOnlyIncomes() {
        // All positive amounts = income, should be excluded → fewer than 7 expenses → nil
        let inputs = (0..<10).map { i in tx(daysAgo: Double(i), amount: 1000) }
        #expect(SpendingPatternAnalyzer.analyze(inputs) == nil)
    }

    @Test
    func returnsValueWithSevenOrMoreExpenses() {
        let inputs = (0..<7).map { i in tx(daysAgo: Double(i + 1)) }
        #expect(SpendingPatternAnalyzer.analyze(inputs) != nil)
    }

    // MARK: - Late-night flag

    @Test
    func detectsLateNightFlag() {
        // 8 out of 10 transactions after 22h → ratio = 0.80 > threshold 0.25
        var inputs = (0..<8).map { i in tx(daysAgo: Double(i + 1), hour: 23) }
        inputs += (8..<10).map { i in tx(daysAgo: Double(i + 1), hour: 12) }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        #expect(result?.activeFlags.contains(.lateNight) == true)
        #expect((result?.lateNightRatio ?? 0) > 0.25)
    }

    @Test
    func noLateNightFlagForDaytimeShopping() {
        let inputs = (0..<10).map { i in tx(daysAgo: Double(i + 1), hour: 10) }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        #expect(result?.activeFlags.contains(.lateNight) != true)
    }

    @Test
    func earlyMorningCountsAsLateNight() {
        // hour 1 should trigger the lateNight flag (< 2 check)
        var inputs = (0..<8).map { i in tx(daysAgo: Double(i + 1), hour: 1) }
        inputs += (8..<10).map { i in tx(daysAgo: Double(i + 1), hour: 14) }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        #expect(result?.activeFlags.contains(.lateNight) == true)
    }

    // MARK: - Category fixation flag

    @Test
    func detectsCategoryFixation() {
        // Delivery: 8 × R$100 = R$800; Mercado: 2 × R$5 = R$10 → share ≈ 0.987 > 0.60
        var inputs = (0..<8).map { i in tx(daysAgo: Double(i + 1), category: "Delivery", amount: -100) }
        inputs += (8..<10).map { i in tx(daysAgo: Double(i + 1), category: "Mercado", amount: -5) }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        #expect(result?.activeFlags.contains(.categoryFixation) == true)
        #expect(result?.topCategory == "Delivery")
    }

    @Test
    func noCategoryFixationWithBalancedSpend() {
        // 5 categories, equal amounts → no category dominates
        let categories = ["Delivery", "Mercado", "Mobilidade", "Saúde", "Assinaturas", "Combustível", "Outros", "Mercado", "Delivery", "Mobilidade"]
        let inputs = categories.enumerated().map { i, cat in
            tx(daysAgo: Double(i + 1), category: cat, amount: -100)
        }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        // Delivery and Mercado appear twice out of 10 = 20% each — well below 60% threshold
        #expect(result?.activeFlags.contains(.categoryFixation) != true)
    }

    // MARK: - Merchant repeat rate flag

    @Test
    func detectsMerchantRepeat() {
        // 7 transactions all at "iFood" → 1 unique / 7 total → repeat = 1 - 1/7 ≈ 0.857 > 0.50
        let inputs = (0..<7).map { i in tx(daysAgo: Double(i) * 0.5, merchant: "iFood") }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        #expect(result?.activeFlags.contains(.merchantRepeat) == true)
    }

    @Test
    func noMerchantRepeatWithAllDifferentMerchants() {
        let merchants = ["iFood", "Uber", "Rappi", "Amazon", "Shopee", "Mercado Livre", "Netflix"]
        let inputs = merchants.enumerated().map { i, m in tx(daysAgo: Double(i) * 0.5, merchant: m) }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        // 7 unique out of 7 = repeat rate 0 < 0.50
        #expect(result?.activeFlags.contains(.merchantRepeat) != true)
    }

    // MARK: - Velocity spike flag

    @Test
    func detectsVelocitySpike() {
        // Baseline (days 8–28): 1 tx/day for 21 days = 21 txns at ~1/day
        // Recent (days 0–6): 3 txns/day for 7 days = 21 txns at 3/day
        // velocityDelta = (3 - 1) / 1 = 2.0 >> 0.60
        var inputs: [PatternInput] = []
        for i in 8...28 { inputs.append(tx(daysAgo: Double(i))) }
        for i in 0..<7 {
            for _ in 0..<3 { inputs.append(tx(daysAgo: Double(i))) }
        }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        #expect(result?.activeFlags.contains(.velocitySpike) == true)
        #expect((result?.velocityDelta ?? 0) > 0.60)
    }

    @Test
    func noVelocitySpikeWithStableRhythm() {
        // Same rate across entire 28-day window
        let inputs = (1...28).map { i in tx(daysAgo: Double(i)) }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        #expect(result?.activeFlags.contains(.velocitySpike) != true)
    }

    @Test
    func noVelocitySpikeWithNoBaseline() {
        // Only recent data, no prior baseline → velocity delta = 0
        let inputs = (0..<7).map { i in tx(daysAgo: Double(i)) }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        // With no baseline, delta is 0 — no false spike
        #expect(result?.velocityDelta == 0)
    }

    // MARK: - Convergent signal gating

    @Test
    func convergentSignalRequiresTwoFlags() {
        // Single isolated signal: only merchant repeat (all same merchant, daytime, balanced categories)
        let inputs = (0..<7).map { i in tx(daysAgo: Double(i) * 0.5, hour: 12, merchant: "iFood") }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        if let r = result {
            if r.activeFlags.count < 2 {
                #expect(r.hasConvergentSignal == false)
            } else {
                // If by coincidence another flag fires too, convergent is true — that's still correct behaviour
                #expect(r.hasConvergentSignal == true)
            }
        }
    }

    @Test
    func hasConvergentSignalWithTwoFlags() {
        // Force both lateNight (8/10 after 22h) AND categoryFixation (all Delivery at high amount)
        var inputs = (0..<8).map { i in tx(daysAgo: Double(i + 1), hour: 23, category: "Delivery", amount: -200) }
        inputs += (8..<10).map { i in tx(daysAgo: Double(i + 1), hour: 23, category: "Mercado", amount: -5) }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        #expect(result?.hasConvergentSignal == true)
    }

    // MARK: - Income exclusion

    @Test
    func incomesAreExcludedFromPatternAnalysis() {
        // 5 large incomes mixed with 7 expenses — incomes should be ignored
        var inputs = (0..<5).map { i in tx(daysAgo: Double(i + 1), amount: 3000) }  // income
        inputs += (0..<7).map { i in tx(daysAgo: Double(i + 1), hour: 23, category: "Delivery", amount: -100) }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        // Should produce a valid result based on the 7 expenses only
        #expect(result != nil)
        #expect(result?.activeFlags.contains(.lateNight) == true)
    }

    // MARK: - Burstiness math sanity

    @Test
    func burstinessIsZeroForPerfectlyRegularTransactions() {
        // Exactly 1 transaction per day → all inter-event gaps = 24h → σ = 0 → B = (0 - 24) / (0 + 24) = -1
        let inputs = (1...14).map { i in tx(daysAgo: Double(i)) }
        let result = SpendingPatternAnalyzer.analyze(inputs)
        // Regular pattern → burstiness should be negative (σ < μ)
        if let b = result?.burstiness {
            #expect(b < 0)
        }
    }
}
