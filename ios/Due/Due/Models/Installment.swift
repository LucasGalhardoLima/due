import Foundation
import SwiftData

@Model
final class Installment {
    var id: UUID
    var merchant: String
    // Contract amount agreed at plan creation. Each child Transaction
    // carries its own realised amount; totalAmount stays fixed even if
    // the user edits a single installment row (the contract didn't
    // change, only the recorded value did).
    var totalAmount: Decimal
    var installmentCount: Int
    var firstDate: Date
    var card: Card?

    @Relationship(deleteRule: .cascade, inverse: \Transaction.installment)
    var transactions: [Transaction] = []

    init(
        id: UUID = UUID(),
        merchant: String,
        totalAmount: Decimal,
        installmentCount: Int,
        firstDate: Date,
        card: Card? = nil
    ) {
        self.id = id
        self.merchant = merchant
        self.totalAmount = totalAmount
        self.installmentCount = installmentCount
        self.firstDate = firstDate
        self.card = card
    }
}
