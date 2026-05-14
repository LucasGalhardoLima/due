import Testing
import Foundation
import SwiftData
@testable import Du

@MainActor
struct HomeViewModelTests {
    private func makeContext() throws -> ModelContext {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(
            for: Card.self, Transaction.self, Installment.self, Insight.self,
            configurations: config
        )
        return ModelContext(container)
    }

    private static let isoFmt: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    private func date(_ iso: String) -> Date {
        guard let d = Self.isoFmt.date(from: iso) else {
            fatalError("Bad ISO date \(iso)")
        }
        return d
    }

    @Test
    func emptyStoreProjectsToZeroDisponivelAndHiddenCardLine() throws {
        let now = date("2026-05-14T12:00:00Z")
        let result = HomeViewModel.project(
            now: now,
            transactions: [],
            cards: [],
            insights: []
        )
        #expect(result.disponivel == 0)
        #expect(result.cardCloses == 99)
        #expect(result.showsCardLine == false)
        #expect(result.recentes.isEmpty)
        #expect(result.insights.isEmpty)
        #expect(result.dia == 14)
        #expect(result.totalDias == 31)
        #expect(result.monthLabel == "MAI")
    }

    @Test
    func disponivelIsIncomeMinusExpensesThisMonth() throws {
        let now = date("2026-05-14T12:00:00Z")
        let salary = Transaction(
            merchant: "Salário",
            amount: Decimal(5_000),
            category: "Renda",
            timestamp: date("2026-05-05T12:00:00Z")
        )
        let groceries = Transaction(
            merchant: "Extra",
            amount: Decimal(-200),
            category: "Mercado",
            timestamp: date("2026-05-10T12:00:00Z")
        )
        // Last-month transaction must NOT contribute to disponível.
        let oldSalary = Transaction(
            merchant: "Salário",
            amount: Decimal(5_000),
            category: "Renda",
            timestamp: date("2026-04-22T12:00:00Z")
        )

        let result = HomeViewModel.project(
            now: now,
            transactions: [salary, groceries, oldSalary],
            cards: [],
            insights: []
        )
        #expect(result.disponivel == 4_800)
    }

    // The exact round-trip the user picks up by tapping Entrar on the
    // scratch onboarding path: insert a welcome Insight, save, fetch, and
    // verify it surfaces in the Home projection so the bell badge + the
    // insights section render.
    @Test
    func scratchOnboardingWelcomeRoundTripsThroughSwiftData() throws {
        let context = try makeContext()

        let welcome = Insight(
            createdAt: date("2026-05-14T11:55:00Z"),
            text: "Tudo pronto. Me conta seu primeiro gasto e eu organizo.",
            actionLabel: "Falar com Du",
            kind: .insight,
            navigateTo: "chat"
        )
        context.insert(welcome)
        try context.save()

        let stored = try context.fetch(FetchDescriptor<Insight>())
        #expect(stored.count == 1)

        let result = HomeViewModel.project(
            now: date("2026-05-14T12:00:00Z"),
            transactions: [],
            cards: [],
            insights: stored
        )
        #expect(result.insights.count == 1)
        #expect(result.insights.first?.text.hasPrefix("Tudo pronto") == true)
        #expect(result.insights.first?.actionLabel == "Falar com Du")
    }

    @Test
    func cardSnapshotSurfacesNearestClosingDate() throws {
        let now = date("2026-05-14T12:00:00Z")
        let nubank = Card(name: "Nubank", limit: 25_000, closingDay: 20, dueDay: 27)
        let itau = Card(name: "Itaú", limit: 10_000, closingDay: 5, dueDay: 12)
        // Itaú already closed for May (day 5 < day 14), so its next close
        // is June 5 — 22 days. Nubank closes May 20 — 6 days. Pick Nubank.

        let charge = Transaction(
            merchant: "iFood",
            amount: Decimal(-50),
            category: "Delivery",
            timestamp: date("2026-05-12T20:00:00Z"),
            card: nubank
        )
        nubank.transactions.append(charge)

        let result = HomeViewModel.project(
            now: now,
            transactions: [charge],
            cards: [nubank, itau],
            insights: []
        )
        #expect(result.cardCloses == 6)
        #expect(result.cardFatura == 50)
        #expect(result.showsCardLine == true)
    }
}
