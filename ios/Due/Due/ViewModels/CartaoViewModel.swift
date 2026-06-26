import Foundation

// Projects raw SwiftData entities into the existing CartaoData view
// contract so CartaoView stays untouched. Pure function, no state —
// easy to unit-test by feeding hand-crafted entity arrays.
//
// Cycle math notes (per the Itaú/Nubank convention the webapp also
// uses): a card "closes" on `closingDay` of each month. Transactions
// posted after the most recent past closing date roll into the OPEN
// invoice — the one the headline number shows. Transactions made on
// or before the closing day belong to the already-closed invoice.
// The first call from HomeViewModel used a coarser "last 30 days"
// approximation; Cartão is where the real cycle lives.
@MainActor
enum CartaoViewModel {
    static func project(
        now: Date = .now,
        cards: [Card],
        transactions: [Transaction],
        installments: [Installment] = []
    ) -> CartaoData {
        let cal = Calendar.current

        guard let card = primaryCard(cards: cards, now: now, cal: cal) else {
            return CartaoData(fatura: 0, limite: 0, fechaEm: 99, categorias: [], recent: [], projecao: 0)
        }

        let cycleStart = mostRecentClose(card, from: now, cal: cal)
        let closesIn = daysToNextClose(card, from: now, cal: cal)
        let closeDate = nextClose(card, from: now, cal: cal)

        // Open-invoice charges: expenses posted on this card after the
        // most recent closing date. Income on the card (refunds) is
        // ignored — the invoice number tracks what you owe, not net.
        let openCharges = transactions.filter {
            $0.card?.id == card.id
                && $0.timestamp > cycleStart
                && $0.amount < 0
        }

        let faturaDecimal = openCharges
            .map { -$0.amount }                  // expenses are negative → flip
            .reduce(Decimal(0), +)
        let fatura = NSDecimalNumber(decimal: faturaDecimal).intValue
        let limite = NSDecimalNumber(decimal: card.limit).intValue

        let categorias = categoryBreakdown(charges: openCharges, fatura: fatura)
        let recent = recentList(charges: openCharges, now: now, cal: cal)
        let projecao = projectedTotal(
            card: card,
            transactions: transactions,
            installments: installments,
            cycleStart: cycleStart,
            closeDate: closeDate,
            cal: cal
        )

        return CartaoData(
            fatura: fatura,
            limite: limite,
            fechaEm: closesIn,
            categorias: categorias,
            recent: recent,
            projecao: projecao
        )
    }

    // MARK: - Card selection

    /// We surface ONE card on this screen. When multiple cards exist,
    /// pick the one whose next close is soonest — that's the invoice
    /// the user is most likely about to be billed for. Tie-broken by
    /// the card's createdAt (oldest first) so swaps are stable.
    private static func primaryCard(cards: [Card], now: Date, cal: Calendar) -> Card? {
        cards.min { a, b in
            let da = daysToNextClose(a, from: now, cal: cal)
            let db = daysToNextClose(b, from: now, cal: cal)
            if da != db { return da < db }
            return a.createdAt < b.createdAt
        }
    }

    // MARK: - Cycle math

    private static func daysToNextClose(_ card: Card, from now: Date, cal: Calendar) -> Int {
        let target = nextClose(card, from: now, cal: cal)
        let nowStart = cal.startOfDay(for: now)
        return max(0, cal.dateComponents([.day], from: nowStart, to: target).day ?? 0)
    }

    private static func nextClose(_ card: Card, from now: Date, cal: Calendar) -> Date {
        var comps = cal.dateComponents([.year, .month], from: now)
        comps.day = card.closingDay
        guard let thisMonthClose = cal.date(from: comps) else { return now }
        return thisMonthClose > now
            ? thisMonthClose
            : (cal.date(byAdding: .month, value: 1, to: thisMonthClose) ?? thisMonthClose)
    }

    /// Most recent closing instant ≤ now. End-of-day on the close day so
    /// a transaction made ON the close day still counts as part of the
    /// invoice that just closed, not the new one (matches issuer rules).
    private static func mostRecentClose(_ card: Card, from now: Date, cal: Calendar) -> Date {
        var comps = cal.dateComponents([.year, .month], from: now)
        comps.day = card.closingDay
        guard let thisMonthClose = cal.date(from: comps) else { return now }
        let endOfThisMonthClose = cal.date(bySettingHour: 23, minute: 59, second: 59, of: thisMonthClose) ?? thisMonthClose
        if endOfThisMonthClose <= now { return endOfThisMonthClose }
        let prev = cal.date(byAdding: .month, value: -1, to: thisMonthClose) ?? thisMonthClose
        return cal.date(bySettingHour: 23, minute: 59, second: 59, of: prev) ?? prev
    }

    // MARK: - Projection

    /// Estimates the total when the current open invoice closes.
    ///
    /// Two components:
    /// 1. **Installments** — deterministic: for each Installment linked to this
    ///    card, compute which installment number falls in the current billing
    ///    cycle using the closing-day rule, and include the per-installment value
    ///    when that number is within range.
    /// 2. **Subscriptions** — heuristic: treat the previous closed cycle's
    ///    "Assinatura" charges as a proxy for this cycle's subscription renewals.
    ///
    /// Returns 0 when there are no installments AND no prior subscription data,
    /// so the view can hide the projection row rather than show a misleading zero.
    private static func projectedTotal(
        card: Card,
        transactions: [Transaction],
        installments: [Installment],
        cycleStart: Date,
        closeDate: Date,
        cal: Calendar
    ) -> Int {
        // ── Installments ──────────────────────────────────────────────────
        let closeMonthIdx = yearMonthIndex(of: closeDate, cal: cal)
        var installmentSum = Decimal(0)
        for inst in installments where inst.card?.id == card.id {
            let firstIdx = firstPaymentMonthIndex(purchaseDate: inst.firstDate, closingDay: card.closingDay, cal: cal)
            let n = closeMonthIdx - firstIdx + 1
            if n >= 1 && n <= inst.installmentCount {
                installmentSum += inst.totalAmount / Decimal(inst.installmentCount)
            }
        }

        // ── Subscriptions from the previous closed cycle ───────────────────
        // Subscriptions are monthly by definition, so last cycle's charges are
        // the best estimate for this cycle before they actually post.
        let oneDayBeforeCycleStart = cal.date(byAdding: .day, value: -1, to: cycleStart) ?? cycleStart
        let prevCycleStart = mostRecentClose(card, from: oneDayBeforeCycleStart, cal: cal)
        let subscriptionSum = transactions
            .filter {
                $0.card?.id == card.id
                && $0.timestamp > prevCycleStart
                && $0.timestamp <= cycleStart
                && $0.amount < 0
                && $0.category == "Assinatura"
            }
            .map { -$0.amount }
            .reduce(Decimal(0), +)

        let total = installmentSum + subscriptionSum
        guard total > 0 else { return 0 }
        return NSDecimalNumber(decimal: total).intValue
    }

    /// 1-based year×12+month index — stable across year boundaries for
    /// simple difference arithmetic (no modular wrap-around).
    private static func yearMonthIndex(of date: Date, cal: Calendar) -> Int {
        cal.component(.year, from: date) * 12 + cal.component(.month, from: date)
    }

    /// Month index of the billing cycle in which installment #1 appears.
    /// Purchases made AFTER the closing day roll into the NEXT month's cycle.
    private static func firstPaymentMonthIndex(purchaseDate: Date, closingDay: Int, cal: Calendar) -> Int {
        let day   = cal.component(.day,   from: purchaseDate)
        let year  = cal.component(.year,  from: purchaseDate)
        let month = cal.component(.month, from: purchaseDate)
        if day > closingDay {
            return month == 12 ? (year + 1) * 12 + 1 : year * 12 + (month + 1)
        }
        return year * 12 + month
    }

    // MARK: - Composition

    private static func categoryBreakdown(charges: [Transaction], fatura: Int) -> [CartaoCategory] {
        guard fatura > 0 else { return [] }

        // Group by category, sum, then turn into CartaoCategory rows
        // sorted by value desc. `over` is left false here because there
        // are no per-category budgets yet — flipping it to true requires
        // a comparison against a teto the user actually set.
        var bucketed: [String: Decimal] = [:]
        for c in charges {
            bucketed[c.category, default: 0] += -c.amount
        }
        return bucketed
            .map { (name, value) -> CartaoCategory in
                let valueInt = NSDecimalNumber(decimal: value).intValue
                let share = Int((Double(valueInt) / Double(fatura) * 100).rounded())
                return CartaoCategory(name: name, valor: valueInt, share: share, over: false)
            }
            .sorted { $0.valor > $1.valor }
    }

    private static func recentList(charges: [Transaction], now: Date, cal: Calendar) -> [CartaoTxn] {
        charges
            .sorted { $0.timestamp > $1.timestamp }
            .prefix(6)
            .map { tx in
                CartaoTxn(
                    merchant: tx.merchant,
                    amount: NSDecimalNumber(decimal: -tx.amount).doubleValue,
                    category: tx.category,
                    when: shortDate(tx.timestamp, now: now, cal: cal)
                )
            }
    }

    // MARK: - Date strings (kept private; mirror HomeViewModel's pt-BR style)

    private static let timeFmt: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "HH:mm"
        return f
    }()

    private static let weekdayFmt: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "EEE"
        return f
    }()

    private static let dayMonthFmt: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "dd MMM"
        return f
    }()

    private static func shortDate(_ date: Date, now: Date, cal: Calendar) -> String {
        if cal.isDateInToday(date) {
            return "hoje · \(timeFmt.string(from: date))"
        }
        if cal.isDateInYesterday(date) {
            return "ontem · \(timeFmt.string(from: date))"
        }
        let days = cal.dateComponents([.day], from: date, to: now).day ?? 0
        if days < 7 {
            let weekday = String(weekdayFmt.string(from: date).prefix(3))
                .replacingOccurrences(of: ".", with: "")
                .lowercased()
            return "\(weekday) · \(timeFmt.string(from: date))"
        }
        return dayMonthFmt.string(from: date).lowercased()
    }
}
