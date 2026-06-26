import Foundation

// Minimal value type the analyzer works with — no SwiftData dependency.
// Production code maps [Transaction] → [PatternInput] in buildChatContext()
// before calling analyze(); tests create PatternInput directly.
struct PatternInput: Sendable {
    let timestamp: Date
    let amount: Decimal   // negative = expense, positive = income (same as Transaction)
    let category: String
    let merchant: String

    var isExpense: Bool { amount < 0 }
}

// Computed signal set from a [PatternInput] window.
struct SpendingPatterns: Sendable {
    let burstiness: Double          // [-1, 1]; >0.4 = temporally clustered
    let lateNightRatio: Double      // [0, 1]; >0.25 = significant late-night buying
    let topCategoryShare: Double    // [0, 1]; >0.60 = category fixation
    let merchantRepeatRate: Double  // [0, 1]; >0.50 = same merchants recurring
    let velocityDelta: Double       // unbounded; >0.60 = purchase-rate spike
    let topCategory: String
    let activeFlags: Set<PatternFlag>

    // Require at least 2 independent signals before surfacing to the user.
    var hasConvergentSignal: Bool { activeFlags.count >= 2 }
}

enum PatternFlag: String, Sendable, Hashable {
    case bursty           // transactions cluster in time rather than spreading evenly
    case lateNight        // significant fraction of purchases happen after 22h
    case categoryFixation // one category dominates spend
    case merchantRepeat   // same merchants visited repeatedly in a short window
    case velocitySpike    // purchase frequency accelerated vs the prior baseline
}

// Pure computation — no I/O, no SwiftData. Safe to call from any actor.
enum SpendingPatternAnalyzer {

    // MARK: - Public

    /// Returns nil when there are fewer than 7 expense records (insufficient baseline).
    static func analyze(_ inputs: [PatternInput]) -> SpendingPatterns? {
        let expenses = inputs.filter(\.isExpense)
        guard expenses.count >= 7 else { return nil }

        let now = Date()
        let cal = Calendar.current

        func daysAgo(_ t: Date) -> Int {
            cal.dateComponents([.day], from: t, to: now).day ?? 9999
        }

        let last14  = expenses.filter { daysAgo($0.timestamp) <= 14 }
        let last7   = expenses.filter { daysAgo($0.timestamp) <= 7 }
        let prior   = expenses.filter { (8...28).contains(daysAgo($0.timestamp)) }
        let all30   = expenses  // caller already scoped to last 30 days

        let burstinessValue     = computeBurstiness(last14) ?? 0
        let lateNightValue      = computeLateNightRatio(all30)
        let (topShare, topCat)  = computeTopCategoryShare(all30)
        let repeatValue         = computeMerchantRepeatRate(last7)
        let velocityValue       = computeVelocityDelta(recent: last7, baseline: prior)

        var flags = Set<PatternFlag>()
        if burstinessValue  > 0.40 { flags.insert(.bursty) }
        if lateNightValue   > 0.25 { flags.insert(.lateNight) }
        if topShare         > 0.60 { flags.insert(.categoryFixation) }
        if repeatValue      > 0.50 { flags.insert(.merchantRepeat) }
        if velocityValue    > 0.60 { flags.insert(.velocitySpike) }

        return SpendingPatterns(
            burstiness: burstinessValue,
            lateNightRatio: lateNightValue,
            topCategoryShare: topShare,
            merchantRepeatRate: repeatValue,
            velocityDelta: velocityValue,
            topCategory: topCat,
            activeFlags: flags
        )
    }

    // MARK: - Signal computations

    // Goh & Barabasi burstiness: B = (σ − μ) / (σ + μ) over inter-event times.
    // Positive → clustered; zero → Poisson; negative → regular.
    private static func computeBurstiness(_ txns: [PatternInput]) -> Double? {
        guard txns.count >= 3 else { return nil }
        let sorted = txns.sorted { $0.timestamp < $1.timestamp }
        let gaps: [Double] = zip(sorted.dropLast(), sorted.dropFirst()).map { a, b in
            b.timestamp.timeIntervalSince(a.timestamp) / 3600  // hours
        }
        guard gaps.count >= 2 else { return nil }
        let mu = gaps.reduce(0, +) / Double(gaps.count)
        guard mu > 0 else { return nil }
        let sigma = (gaps.map { ($0 - mu) * ($0 - mu) }.reduce(0, +) / Double(gaps.count)).squareRoot()
        return (sigma - mu) / (sigma + mu)
    }

    private static func computeLateNightRatio(_ txns: [PatternInput]) -> Double {
        guard !txns.isEmpty else { return 0 }
        let cal = Calendar.current
        let late = txns.filter {
            let h = cal.component(.hour, from: $0.timestamp)
            return h >= 22 || h < 2
        }.count
        return Double(late) / Double(txns.count)
    }

    // Returns (share of top category, name of top category).
    private static func computeTopCategoryShare(_ txns: [PatternInput]) -> (Double, String) {
        guard !txns.isEmpty else { return (0, "") }
        var byCategory: [String: Decimal] = [:]
        var total: Decimal = 0
        for t in txns {
            let abs = Swift.abs(t.amount)
            byCategory[t.category, default: 0] += abs
            total += abs
        }
        guard total > 0, let top = byCategory.max(by: { $0.value < $1.value }) else {
            return (0, "")
        }
        let share = NSDecimalNumber(decimal: top.value / total).doubleValue
        return (share, top.key)
    }

    // repeatRate = 1 − (uniqueMerchants / totalPurchases).
    // Near 1 → all purchases at same merchants; near 0 → all different.
    private static func computeMerchantRepeatRate(_ txns: [PatternInput]) -> Double {
        guard txns.count >= 2 else { return 0 }
        let unique = Set(txns.map { $0.merchant.lowercased().trimmingCharacters(in: .whitespaces) }).count
        return 1.0 - Double(unique) / Double(txns.count)
    }

    // velocityDelta = (recentRate − baselineRate) / baselineRate.
    // recent = last 7 days; baseline = days 8–28.
    private static func computeVelocityDelta(recent: [PatternInput], baseline: [PatternInput]) -> Double {
        let baselineRate = Double(baseline.count) / 21.0
        guard baselineRate > 0 else { return 0 }
        let recentRate = Double(recent.count) / 7.0
        return (recentRate - baselineRate) / baselineRate
    }
}
