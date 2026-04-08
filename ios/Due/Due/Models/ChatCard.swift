import Foundation

// MARK: - ChatCard Enum

enum ChatCard: Codable, Identifiable, Equatable {
    case budget(BudgetCard)
    case installmentTimeline(InstallmentTimelineCard)
    case transactionList(TransactionListCard)
    case action(ActionCard)
    case summary(SummaryCard)

    var id: String {
        switch self {
        case .budget(let card): card.id
        case .installmentTimeline(let card): card.id
        case .transactionList(let card): card.id
        case .action(let card): card.id
        case .summary(let card): card.id
        }
    }

    var isActionCard: Bool {
        if case .action = self { return true }
        return false
    }

    // MARK: - Codable

    private enum CodingKeys: String, CodingKey {
        case type
    }

    private enum CardType: String, Codable {
        case budget
        case installmentTimeline
        case transactionList
        case action
        case summary
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(CardType.self, forKey: .type)

        let singleContainer = try decoder.singleValueContainer()
        switch type {
        case .budget:
            self = .budget(try singleContainer.decode(BudgetCard.self))
        case .installmentTimeline:
            self = .installmentTimeline(try singleContainer.decode(InstallmentTimelineCard.self))
        case .transactionList:
            self = .transactionList(try singleContainer.decode(TransactionListCard.self))
        case .action:
            self = .action(try singleContainer.decode(ActionCard.self))
        case .summary:
            self = .summary(try singleContainer.decode(SummaryCard.self))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .budget(let card): try container.encode(card)
        case .installmentTimeline(let card): try container.encode(card)
        case .transactionList(let card): try container.encode(card)
        case .action(let card): try container.encode(card)
        case .summary(let card): try container.encode(card)
        }
    }
}

// MARK: - Severity

enum Severity: String, Codable, Equatable {
    case ok
    case warning
    case danger
}

// MARK: - BudgetCard

struct BudgetCard: Codable, Identifiable, Equatable {
    let id: String
    let type: String
    let categoryName: String
    let limit: Decimal
    let actual: Decimal
    let severity: Severity
    let summary: String

    var progress: Double {
        guard limit > 0 else { return 0 }
        return NSDecimalNumber(decimal: actual).doubleValue / NSDecimalNumber(decimal: limit).doubleValue
    }

    init(id: String = UUID().uuidString, categoryName: String, limit: Decimal, actual: Decimal, severity: Severity, summary: String) {
        self.id = id
        self.type = "budget"
        self.categoryName = categoryName
        self.limit = limit
        self.actual = actual
        self.severity = severity
        self.summary = summary
    }
}

// MARK: - InstallmentTimelineCard

struct TimelineEntry: Codable, Identifiable, Equatable {
    var id: String { "\(year)-\(month)" }
    let month: String
    let year: Int
    let amount: Decimal
}

struct InstallmentTimelineCard: Codable, Identifiable, Equatable {
    let id: String
    let type: String
    let entries: [TimelineEntry]
    let totalCommitted: Decimal

    init(id: String = UUID().uuidString, entries: [TimelineEntry], totalCommitted: Decimal) {
        self.id = id
        self.type = "installmentTimeline"
        self.entries = entries
        self.totalCommitted = totalCommitted
    }
}

// MARK: - TransactionListCard

struct CompactTransaction: Codable, Identifiable, Equatable {
    let id: String
    let description: String
    let amount: Decimal
    let date: String
    let category: String

    init(id: String = UUID().uuidString, description: String, amount: Decimal, date: String, category: String) {
        self.id = id
        self.description = description
        self.amount = amount
        self.date = date
        self.category = category
    }
}

struct TransactionListCard: Codable, Identifiable, Equatable {
    let id: String
    let type: String
    let transactions: [CompactTransaction]

    init(id: String = UUID().uuidString, transactions: [CompactTransaction]) {
        self.id = id
        self.type = "transactionList"
        self.transactions = transactions
    }
}

// MARK: - ActionCard

enum ActionType: String, Codable, Equatable {
    case createBudget
    case viewDetail
    case confirm
}

struct CardAction: Codable, Identifiable, Equatable {
    let id: String
    let label: String
    let actionType: ActionType
    let payload: String?

    init(id: String = UUID().uuidString, label: String, actionType: ActionType, payload: String? = nil) {
        self.id = id
        self.label = label
        self.actionType = actionType
        self.payload = payload
    }
}

struct ActionCard: Codable, Identifiable, Equatable {
    let id: String
    let type: String
    let title: String
    let actions: [CardAction]

    init(id: String = UUID().uuidString, title: String, actions: [CardAction]) {
        self.id = id
        self.type = "action"
        self.title = title
        self.actions = actions
    }
}

// MARK: - SummaryCard

struct KeyValuePair: Codable, Identifiable, Equatable {
    var id: String { label }
    let label: String
    let value: String
}

struct SummaryCard: Codable, Identifiable, Equatable {
    let id: String
    let type: String
    let title: String
    let pairs: [KeyValuePair]

    init(id: String = UUID().uuidString, title: String, pairs: [KeyValuePair]) {
        self.id = id
        self.type = "summary"
        self.title = title
        self.pairs = pairs
    }
}
