import Foundation

@MainActor
@Observable
final class DashboardViewModel {
    var budgetSummary: BudgetSummary?
    var cards: [Card] = []
    var cardInvoices: [String: InvoiceSummary] = [:]
    var installmentsHealth: InstallmentHealthResponse?
    var aiInsight: String?
    var unreadNotificationCount: Int = 0
    var isLoading = false
    var error: String?
    var errorKind: ErrorKind?

    private let api = APIClient.shared

    var currentMonth: Int { Calendar.current.component(.month, from: Date()) }
    var currentYear: Int { Calendar.current.component(.year, from: Date()) }

    func load() async {
        isLoading = true
        error = nil
        errorKind = nil

        do {
            async let summaryTask: BudgetSummary = api.request(
                .budgetSummary(month: currentMonth, year: currentYear)
            )
            async let cardsTask: [Card] = api.request(.cards())
            async let healthTask: InstallmentHealthResponse = api.request(.installmentsHealth())
            async let insightTask: AIInsightResponse = api.request(.aiInsights())

            let (summary, loadedCards, health, insight) = try await (
                summaryTask, cardsTask, healthTask, insightTask
            )

            budgetSummary = summary
            cards = loadedCards
            installmentsHealth = health
            aiInsight = insight.insight

            // Load invoice summary per card in parallel
            await withTaskGroup(of: (String, InvoiceSummary?).self) { group in
                for card in loadedCards {
                    group.addTask { [currentMonth, currentYear] in
                        let invoice: InvoiceSummary? = try? await self.api.request(
                            .invoiceSummary(month: currentMonth, year: currentYear, cardId: card.id)
                        )
                        return (card.id, invoice)
                    }
                }
                for await (cardId, invoice) in group {
                    if let invoice {
                        cardInvoices[cardId] = invoice
                    }
                }
            }
        } catch {
            self.error = error.localizedDescription
            self.errorKind = (error as? APIError)?.kind ?? .loadFailure
        }

        // Load unread notification count (non-blocking)
        if let response: UnreadCountResponse = try? await api.request(.unreadNotificationCount()) {
            unreadNotificationCount = response.unreadCount
        }

        isLoading = false
    }

    func loadUnreadCount() async {
        if let response: UnreadCountResponse = try? await api.request(.unreadNotificationCount()) {
            unreadNotificationCount = response.unreadCount
        }
    }

    // MARK: - Computed Text Properties

    /// "Você tem R$2.340 disponíveis"
    var headlineText: String? {
        guard let summary = budgetSummary else { return nil }
        return "Você tem \(CurrencyFormatter.formatCompact(summary.remaining)) disponíveis"
    }

    /// "Gastou R$1.890 este mês. R$580 em alimentação, R$340 em transporte."
    var spendingPulseText: String? {
        guard let summary = budgetSummary else { return nil }
        let total = CurrencyFormatter.formatCompact(summary.totalSpending)
        let topTwo = summary.categories
            .sorted { $0.actualSpending > $1.actualSpending }
            .prefix(2)

        if topTwo.isEmpty {
            return "Gastou \(total) este mês."
        }

        let details = topTwo.map { cat in
            "\(CurrencyFormatter.formatCompact(cat.actualSpending)) em \(cat.categoryName.lowercased())"
        }.joined(separator: ", ")

        return "Gastou \(total) este mês. \(details)."
    }

    /// Categories that are over budget or near limit
    var attentionCategories: [BudgetSummary.CategorySpending] {
        guard let summary = budgetSummary else { return [] }
        return summary.categories.filter { $0.status == "exceeded" || $0.status == "warning" }
    }

    /// Card line data: (card, invoice total, days until closing)
    var cardLines: [(card: Card, total: Double, daysUntilClosing: Int)] {
        cards.compactMap { card in
            let total = cardInvoices[card.id]?.total ?? 0
            let days = Self.daysUntilClosing(closingDay: card.closingDay)
            return (card: card, total: total, daysUntilClosing: days)
        }
    }

    /// "3 parcelamentos ativos, R$450/mês pelos próximos 4 meses"
    var installmentsSentence: String? {
        guard let health = installmentsHealth, health.activeCount > 0 else { return nil }
        let count = health.activeCount
        let monthly = CurrencyFormatter.formatCompact(health.totalMonthlyCommitment)
        let plural = count == 1 ? "parcelamento ativo" : "parcelamentos ativos"
        return "\(count) \(plural), \(monthly)/mês"
    }

    // MARK: - Helpers

    static func daysUntilClosing(closingDay: Int) -> Int {
        let cal = Calendar.current
        let today = cal.component(.day, from: Date())
        let daysInMonth = cal.range(of: .day, in: .month, for: Date())!.count

        if closingDay > today {
            return closingDay - today
        } else if closingDay == today {
            return 0
        } else {
            return daysInMonth - today + closingDay
        }
    }

    func severityDot(for category: BudgetSummary.CategorySpending) -> String {
        switch category.status {
        case "exceeded": return "\u{1F534}" // red
        case "warning": return "\u{1F7E1}" // yellow
        default: return "\u{1F7E2}" // green
        }
    }
}
