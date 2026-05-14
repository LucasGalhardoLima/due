import Foundation
import SwiftData

enum InsightKind: String, Codable {
    case auto
    case alert
    case insight
    case reminder
}

@Model
final class Insight {
    var id: UUID
    var createdAt: Date
    var text: String
    var actionLabel: String?
    var kind: InsightKind
    var urgent: Bool
    var read: Bool
    // AppDestination raw value (chat, cartao, overview, ...) when tapping
    // the action should jump to a specific screen. Kept as String so the
    // model file does not depend on the navigation enum.
    var navigateTo: String?

    init(
        id: UUID = UUID(),
        createdAt: Date = .now,
        text: String,
        actionLabel: String? = nil,
        kind: InsightKind = .auto,
        urgent: Bool = false,
        read: Bool = false,
        navigateTo: String? = nil
    ) {
        self.id = id
        self.createdAt = createdAt
        self.text = text
        self.actionLabel = actionLabel
        self.kind = kind
        self.urgent = urgent
        self.read = read
        self.navigateTo = navigateTo
    }
}
