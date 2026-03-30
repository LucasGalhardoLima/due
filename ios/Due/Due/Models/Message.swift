import Foundation

struct Message: Identifiable, Equatable {
    let id: UUID
    let role: Role
    var content: String
    let timestamp: Date
    var cards: [ChatCard]

    enum Role: String, Codable {
        case user
        case assistant
    }

    init(id: UUID = UUID(), role: Role, content: String, timestamp: Date = Date(), cards: [ChatCard] = []) {
        self.id = id
        self.role = role
        self.content = content
        self.timestamp = timestamp
        self.cards = cards
    }
}
