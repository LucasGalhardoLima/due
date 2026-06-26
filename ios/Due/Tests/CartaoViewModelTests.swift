import Testing
import Foundation
import SwiftData
@testable import Du

@MainActor
struct CartaoViewModelTests {
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
    func noCardsReturnsZeroedDataWithHiddenCloseBadge() {
        let result = CartaoViewModel.project(
            now: date("2026-05-14T12:00:00Z"),
            cards: [],
            transactions: []
        )
        #expect(result.fatura == 0)
        #expect(result.limite == 0)
        #expect(result.fechaEm == 99)
        #expect(result.categorias.isEmpty)
        #expect(result.recent.isEmpty)
        #expect(result.pct == 0)
    }

    // Closing day is 5; "now" is May 14. May 5 already closed, so an
    // expense on May 3 belongs to the closed invoice, and an expense
    // on May 10 belongs to the open invoice. fatura should only see
    // the May 10 charge.
    @Test
    func openInvoiceExcludesChargesBeforeMostRecentClose() {
        let card = Card(name: "Itaú", limit: 10_000, closingDay: 5, dueDay: 12)
        let closedCharge = Transaction(
            merchant: "iFood",
            amount: Decimal(-100),
            category: "Delivery",
            timestamp: date("2026-05-03T12:00:00Z"),
            card: card
        )
        let openCharge = Transaction(
            merchant: "Uber",
            amount: Decimal(-50),
            category: "Mobilidade",
            timestamp: date("2026-05-10T12:00:00Z"),
            card: card
        )

        let result = CartaoViewModel.project(
            now: date("2026-05-14T12:00:00Z"),
            cards: [card],
            transactions: [closedCharge, openCharge]
        )
        #expect(result.fatura == 50)
        #expect(result.fechaEm == 22)        // May 14 → Jun 5
        #expect(result.recent.count == 1)
        #expect(result.recent.first?.merchant == "Uber")
    }

    // Closing day is 20; now is May 14. The "most recent close" is
    // April 20, so all of these May charges belong to the open invoice.
    @Test
    func multipleChargesAccumulateIntoOpenInvoice() {
        let card = Card(name: "Nubank", limit: 25_000, closingDay: 20, dueDay: 27)
        let charges = [
            Transaction(merchant: "iFood",   amount: Decimal(-200), category: "Delivery",   timestamp: date("2026-05-01T10:00:00Z"), card: card),
            Transaction(merchant: "Mercado", amount: Decimal(-500), category: "Mercado",    timestamp: date("2026-05-05T10:00:00Z"), card: card),
            Transaction(merchant: "iFood",   amount: Decimal(-100), category: "Delivery",   timestamp: date("2026-05-12T10:00:00Z"), card: card)
        ]

        let result = CartaoViewModel.project(
            now: date("2026-05-14T12:00:00Z"),
            cards: [card],
            transactions: charges
        )
        #expect(result.fatura == 800)
        #expect(result.fechaEm == 6)        // May 14 → May 20
        #expect(result.recent.count == 3)
        // Sorted by descending timestamp — May 12 first.
        #expect(result.recent.first?.merchant == "iFood")
        #expect(result.recent.first?.amount == 100.0)

        // Categoria breakdown — Delivery aggregates to 300 (37.5% ≈ 38),
        // Mercado is 500 (62.5% ≈ 63). Sorted by valor desc.
        #expect(result.categorias.count == 2)
        #expect(result.categorias[0].name == "Mercado")
        #expect(result.categorias[0].valor == 500)
        #expect(result.categorias[1].name == "Delivery")
        #expect(result.categorias[1].valor == 300)
        let shareSum = result.categorias.map(\.share).reduce(0, +)
        #expect(shareSum >= 99 && shareSum <= 101, "shares should sum to ~100 modulo rounding, got \(shareSum)")
    }

    // When multiple cards exist, the card with the soonest upcoming
    // close is the one Cartão surfaces — that's the invoice the user
    // is about to be billed for.
    @Test
    func primaryCardIsTheOneClosingSoonest() {
        let nubank = Card(name: "Nubank", limit: 25_000, closingDay: 20, dueDay: 27)
        let itau = Card(name: "Itaú", limit: 10_000, closingDay: 5, dueDay: 12)
        // Itaú already closed for May; next close is June 5 (22 days).
        // Nubank closes May 20 (6 days). Cartão picks Nubank.
        let nubankCharge = Transaction(
            merchant: "Test", amount: Decimal(-77), category: "Outros",
            timestamp: date("2026-05-12T10:00:00Z"), card: nubank
        )
        let itauCharge = Transaction(
            merchant: "Old", amount: Decimal(-999), category: "Outros",
            timestamp: date("2026-05-10T10:00:00Z"), card: itau
        )

        let result = CartaoViewModel.project(
            now: date("2026-05-14T12:00:00Z"),
            cards: [itau, nubank],     // intentional reverse order
            transactions: [nubankCharge, itauCharge]
        )
        #expect(result.limite == 25_000)
        #expect(result.fatura == 77)        // only Nubank's transactions count
    }

    // Income on the card (refunds, cashback credits) should NOT subtract
    // from the open invoice. Today's contract: fatura tracks what you owe.
    @Test
    func incomeOnCardDoesNotReduceFatura() {
        let card = Card(name: "X", limit: 10_000, closingDay: 20, dueDay: 27)
        let charge = Transaction(merchant: "iFood", amount: Decimal(-200), category: "Delivery", timestamp: date("2026-05-10T10:00:00Z"), card: card)
        let refund = Transaction(merchant: "Refund", amount: Decimal(50), category: "Outros",   timestamp: date("2026-05-11T10:00:00Z"), card: card)

        let result = CartaoViewModel.project(
            now: date("2026-05-14T12:00:00Z"),
            cards: [card],
            transactions: [charge, refund]
        )
        #expect(result.fatura == 200)
    }

    // MARK: - Projection (previsão de fechamento)

    // Card closes day 20; now is May 14 → open cycle is Apr 20 → May 20.
    // A 12× installment bought Mar 10 (≤ closing day, so installment #1
    // lands in March's cycle) puts installment #3 in the open cycle:
    // 1200 / 12 = 100 projected.
    @Test
    func projectionIncludesInstallmentFallingInCurrentCycle() {
        let card = Card(name: "Nubank", limit: 25_000, closingDay: 20, dueDay: 27)
        let plan = Installment(
            merchant: "Magalu",
            totalAmount: Decimal(1200),
            installmentCount: 12,
            firstDate: date("2026-03-10T10:00:00Z"),
            card: card
        )

        let result = CartaoViewModel.project(
            now: date("2026-05-14T12:00:00Z"),
            cards: [card],
            transactions: [],
            installments: [plan]
        )
        #expect(result.projecao == 100)
    }

    // A plan whose last installment already billed before the open cycle
    // contributes nothing — installment number 17 is out of a 3× plan's
    // range, so the projection stays 0 and the view hides the row.
    @Test
    func projectionExcludesCompletedInstallment() {
        let card = Card(name: "Nubank", limit: 25_000, closingDay: 20, dueDay: 27)
        let finished = Installment(
            merchant: "Old TV",
            totalAmount: Decimal(300),
            installmentCount: 3,
            firstDate: date("2025-01-10T10:00:00Z"),
            card: card
        )

        let result = CartaoViewModel.project(
            now: date("2026-05-14T12:00:00Z"),
            cards: [card],
            transactions: [],
            installments: [finished]
        )
        #expect(result.projecao == 0)
    }

    // Regression: the previous cycle's "Assinaturas" charges are the proxy
    // for this cycle's renewals. The filter must match the canonical plural
    // category string the rest of the app writes ("Assinaturas"), not the
    // singular "Assinatura" — the singular form silently projected 0.
    // Open cycle is Apr 20 → May 20, so the previous cycle is Mar 20 → Apr 20;
    // a Spotify charge on Apr 5 falls in it and projects forward.
    @Test
    func projectionIncludesPreviousCycleSubscription() {
        let card = Card(name: "Nubank", limit: 25_000, closingDay: 20, dueDay: 27)
        let spotify = Transaction(
            merchant: "Spotify",
            amount: Decimal(-50),
            category: "Assinaturas",
            timestamp: date("2026-04-05T09:00:00Z"),
            card: card
        )

        let result = CartaoViewModel.project(
            now: date("2026-05-14T12:00:00Z"),
            cards: [card],
            transactions: [spotify],
            installments: []
        )
        // Apr 5 is in the previous (closed) cycle, so it doesn't inflate the
        // open fatura — only the projection.
        #expect(result.fatura == 0)
        #expect(result.projecao == 50)
    }

    // The two components add: an in-cycle installment (100) plus a prior
    // subscription proxy (50) → 150.
    @Test
    func projectionSumsInstallmentsAndSubscriptions() {
        let card = Card(name: "Nubank", limit: 25_000, closingDay: 20, dueDay: 27)
        let plan = Installment(
            merchant: "Magalu",
            totalAmount: Decimal(1200),
            installmentCount: 12,
            firstDate: date("2026-03-10T10:00:00Z"),
            card: card
        )
        let netflix = Transaction(
            merchant: "Netflix",
            amount: Decimal(-50),
            category: "Assinaturas",
            timestamp: date("2026-04-05T09:00:00Z"),
            card: card
        )

        let result = CartaoViewModel.project(
            now: date("2026-05-14T12:00:00Z"),
            cards: [card],
            transactions: [netflix],
            installments: [plan]
        )
        #expect(result.projecao == 150)
    }
}
