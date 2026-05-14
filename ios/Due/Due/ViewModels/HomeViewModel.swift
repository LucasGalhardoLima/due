import Foundation

// Projects raw SwiftData entities into the existing HomeData view contract
// so HomeView stays untouched. Pure function, no state — easy to unit-test
// by feeding hand-crafted entity arrays.
@MainActor
enum HomeViewModel {
    static func project(
        now: Date = .now,
        transactions: [Transaction],
        cards: [Card],
        insights: [Insight]
    ) -> HomeData {
        let cal = Calendar.current
        let totalDias = cal.range(of: .day, in: .month, for: now)?.count ?? 30
        let dia = cal.component(.day, from: now)
        let monthLabel = monthLabelFmt.string(from: now)
            .replacingOccurrences(of: ".", with: "")
            .uppercased()

        // disponível: sum of this-month transactions. Income is positive,
        // expense is negative, so summing both gives net cash this month.
        // Clamp at zero so the headline never shows a deficit (the
        // habits/over-the-teto messaging lives in Insights, not here).
        let monthInterval = cal.dateInterval(of: .month, for: now)
            ?? DateInterval(start: now, end: now)
        let thisMonth = transactions.filter { monthInterval.contains($0.timestamp) }
        let net = thisMonth.map(\.amount).reduce(Decimal(0), +)
        let disponivel = max(0, NSDecimalNumber(decimal: net).intValue)

        // Top 4 transactions by descending timestamp.
        let recentes = transactions
            .sorted { $0.timestamp > $1.timestamp }
            .prefix(4)
            .map { tx in
                RecentItem(
                    name: tx.merchant,
                    amount: NSDecimalNumber(decimal: tx.amount).doubleValue,
                    sub: shortDate(tx.timestamp, now: now, cal: cal)
                )
            }

        let cardSnap = cardSnapshot(
            now: now,
            cards: cards,
            transactions: transactions,
            cal: cal
        )

        let homeInsights = insights
            .filter { !$0.read }
            .sorted { $0.createdAt > $1.createdAt }
            .prefix(2)
            .map { ins in
                HomeInsight(
                    time: timeAgo(ins.createdAt, now: now, cal: cal),
                    text: ins.text,
                    actionLabel: ins.actionLabel
                )
            }

        return HomeData(
            disponivel: disponivel,
            monthLabel: monthLabel,
            dia: dia,
            totalDias: totalDias,
            cardCloses: cardSnap.closesIn,
            cardFatura: cardSnap.fatura,
            cardLimitePct: cardSnap.pct,
            insights: Array(homeInsights),
            recentes: Array(recentes)
        )
    }

    // MARK: - Card cycle

    private struct CardSnap {
        let closesIn: Int
        let fatura: Int
        let pct: Int
    }

    // Rough cycle math: picks the card with the soonest upcoming close
    // and treats "fatura" as expenses on that card over the last 30 days.
    // Good enough for the Home headline. The full Itaú-style cycle math
    // (close on day X → due on day X+~10, transactions bucket into the
    // open invoice based on closing date) lives in the webapp today; will
    // port when CartãoView migrates off MockData.
    private static func cardSnapshot(
        now: Date,
        cards: [Card],
        transactions: [Transaction],
        cal: Calendar
    ) -> CardSnap {
        guard let card = cards.min(by: {
            daysToNextClose($0, from: now, cal: cal)
                < daysToNextClose($1, from: now, cal: cal)
        }) else {
            // No cards yet → cardLevel(.later) → showsCardLine is false.
            return CardSnap(closesIn: 99, fatura: 0, pct: 0)
        }

        let closesIn = daysToNextClose(card, from: now, cal: cal)

        let cutoff = cal.date(byAdding: .day, value: -30, to: now) ?? now
        let onThisCard = transactions.filter {
            $0.card?.id == card.id && $0.timestamp >= cutoff && $0.amount < 0
        }
        let faturaDecimal = onThisCard
            .map(\.amount)
            .reduce(Decimal(0), +)
        let fatura = abs(NSDecimalNumber(decimal: faturaDecimal).intValue)

        let limitInt = NSDecimalNumber(decimal: card.limit).intValue
        let pct = limitInt > 0
            ? Int((Double(fatura) / Double(limitInt) * 100).rounded())
            : 0

        return CardSnap(closesIn: closesIn, fatura: fatura, pct: pct)
    }

    private static func daysToNextClose(_ card: Card, from now: Date, cal: Calendar) -> Int {
        var comps = cal.dateComponents([.year, .month], from: now)
        comps.day = card.closingDay
        guard let thisMonthClose = cal.date(from: comps) else { return 30 }
        let target = thisMonthClose > now
            ? thisMonthClose
            : (cal.date(byAdding: .month, value: 1, to: thisMonthClose) ?? thisMonthClose)
        return max(0, cal.dateComponents([.day], from: now, to: target).day ?? 0)
    }

    // MARK: - Date strings

    private static let monthLabelFmt: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "MMM"
        return f
    }()

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
        if cal.isDateInYesterday(date) { return "ontem" }
        let days = cal.dateComponents([.day], from: date, to: now).day ?? 0
        if days < 7 {
            return String(weekdayFmt.string(from: date).prefix(3))
                .replacingOccurrences(of: ".", with: "")
                .lowercased()
        }
        return dayMonthFmt.string(from: date).lowercased()
    }

    private static func timeAgo(_ date: Date, now: Date, cal: Calendar) -> String {
        let mins = cal.dateComponents([.minute], from: date, to: now).minute ?? 0
        if mins < 60 { return "agora" }
        let hours = mins / 60
        if hours < 24 { return "\(hours)h" }
        if cal.isDateInYesterday(date) { return "ontem" }
        let days = cal.dateComponents([.day], from: date, to: now).day ?? 0
        return "\(days)d"
    }
}
