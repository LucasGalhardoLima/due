#if DEBUG
import Foundation
import SwiftData

// DEBUG-only helper that lets devs populate the local SwiftData store
// with a representative dataset so the screens look like the prototype
// while we migrate them off MockData. Not compiled into RELEASE.
@MainActor
enum MockSeeder {
    static func wipe(context: ModelContext) throws {
        // Children before parents so cascade rules don't trip on edits.
        try context.delete(model: Transaction.self)
        try context.delete(model: Installment.self)
        try context.delete(model: Insight.self)
        try context.delete(model: Card.self)
        try context.save()
    }

    static func seed(context: ModelContext) throws {
        try wipe(context: context)

        let cal = Calendar.current
        let now = Date()

        let card = Card(
            name: "Nubank Roxinho",
            limit: 25_000,
            closingDay: 5,
            dueDay: 12
        )
        context.insert(card)

        // Income — anchor disponível to a positive baseline.
        let salaryDate = cal.date(bySetting: .day, value: 22, of: now) ?? now
        context.insert(Transaction(
            merchant: "Salário",
            amount: 35_000,
            category: "Renda",
            timestamp: salaryDate
        ))

        // Recent expenses (within last few days). Negative amounts.
        let recents: [(String, Decimal, String, Int)] = [
            ("iFood",              -47.90,  "Delivery",     0),
            ("Supermercado Extra", -312.45, "Mercado",     -1),
            ("Spotify",            -34.90,  "Assinaturas", -3),
            ("Uber",               -23.50,  "Mobilidade",   0)
        ]
        for (merchant, amount, category, dayOffset) in recents {
            let date = cal.date(byAdding: .day, value: dayOffset, to: now) ?? now
            context.insert(Transaction(
                merchant: merchant,
                amount: amount,
                category: category,
                timestamp: date,
                card: card
            ))
        }

        context.insert(Insight(
            createdAt: now,
            text: "Delivery passou do teto em R$ 1.180.",
            actionLabel: "Ver",
            kind: .insight,
            navigateTo: "overview"
        ))
        context.insert(Insight(
            createdAt: cal.date(byAdding: .day, value: -1, to: now) ?? now,
            text: "3 parcelas terminam em abril. Liberam R$ 2.340 na próxima fatura.",
            kind: .insight
        ))

        try context.save()
    }
}
#endif
