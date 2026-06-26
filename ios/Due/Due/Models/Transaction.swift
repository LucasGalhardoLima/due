import Foundation
import SwiftData

// Positive amount = income (e.g., salário); negative = expense.
// Same sign convention MockData used; expressed in Decimal to honor
// Constitution Principle 3 (no Double for currency).
//
// Note: this type shadows SwiftUI.Transaction (the animation-context
// struct used in withAnimation). Inside this module the local
// definition wins; in files that need both, qualify with `SwiftUI.`.
@Model
final class Transaction {
    var id: UUID
    var merchant: String
    var amount: Decimal
    var category: String
    var timestamp: Date
    var card: Card?
    var installment: Installment?

    init(
        id: UUID = UUID(),
        merchant: String,
        amount: Decimal,
        category: String,
        timestamp: Date = .now,
        card: Card? = nil,
        installment: Installment? = nil
    ) {
        self.id = id
        self.merchant = merchant
        self.amount = amount
        self.category = category
        self.timestamp = timestamp
        self.card = card
        self.installment = installment
    }

    var isIncome: Bool { amount > 0 }
}
