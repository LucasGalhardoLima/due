import Foundation
import SwiftData

@Model
final class Card {
    var id: UUID
    var name: String
    var limit: Decimal
    var closingDay: Int
    var dueDay: Int
    var createdAt: Date

    @Relationship(deleteRule: .cascade, inverse: \Transaction.card)
    var transactions: [Transaction] = []

    init(
        id: UUID = UUID(),
        name: String,
        limit: Decimal,
        closingDay: Int,
        dueDay: Int,
        createdAt: Date = .now
    ) {
        self.id = id
        self.name = name
        self.limit = limit
        self.closingDay = closingDay
        self.dueDay = dueDay
        self.createdAt = createdAt
    }
}
