import Foundation

struct Message: Identifiable, Equatable {
    let id: UUID
    let role: Role
    var content: String
    let timestamp: Date
    var cards: [CardData]?

    enum Role: String, Codable {
        case user
        case assistant
    }

    struct CardData: Codable, Equatable, Identifiable {
        let id: String
        let type: String
        let title: String
        let value: String?
    }

    init(id: UUID = UUID(), role: Role, content: String, timestamp: Date = Date(), cards: [CardData]? = nil) {
        self.id = id
        self.role = role
        self.content = content
        self.timestamp = timestamp
        self.cards = cards
    }
}
