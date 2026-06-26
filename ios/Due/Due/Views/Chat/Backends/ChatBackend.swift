import Foundation

// User-facing backend choice. `.auto` defers to ChatBackendResolver, which
// picks the best tier available at runtime (Apple FoundationModels on iOS 26+
// with Apple Intelligence enabled, else the rule-based baseline).
// Debug builds expose an explicit picker in Settings; Release always uses `.auto`.
enum ChatBackendKind: String, CaseIterable, Identifiable, Codable {
    case auto
    case ruleBased
    case appleFoundationModels

    var id: String { rawValue }

    var family: BackendFamily {
        switch self {
        case .auto:                  return .auto
        case .ruleBased:             return .rules
        case .appleFoundationModels: return .appleFoundationModels
        }
    }

    var label: String {
        switch self {
        case .auto:                  return "Automático"
        case .ruleBased:             return "Regras"
        case .appleFoundationModels: return "Apple Intelligence"
        }
    }

    var subtitle: String {
        switch self {
        case .auto:
            return "Du escolhe o melhor backend pra esse iPhone"
        case .ruleBased:
            return "Padrões hard-coded — rápido, previsível, sem IA"
        case .appleFoundationModels:
            return "On-device · iOS 26+ · iPhone 15 Pro / 16+ / Apple Silicon"
        }
    }
}

enum BackendFamily: String, Codable {
    case auto
    case rules
    case appleFoundationModels
}

// Streamed reply: one event at a time. The view model renders chunks live
// and appends structured cards as they arrive.
enum ChatStreamEvent: Sendable {
    case textChunk(String)             // append to the in-flight assistant bubble
    case finalText(String)             // commit the assistant bubble (replaces in-flight)
    case structured(StructuredOutput)  // rich card (expense / insight)
    case suggestions([String])         // chip row
    case done(BackendStats)            // latency + token stats
}

enum StructuredOutput: Sendable {
    case expense(ExpenseProposal)
    case insight(ChatInsight)
}

struct BackendStats: Sendable {
    let firstTokenMs: Int
    let totalMs: Int
    let outputTokens: Int
    let parseSuccess: Bool
}

protocol ChatBackend: Sendable {
    var kind: ChatBackendKind { get }
    /// Optional warmup (load model, initialize session). Safe to call repeatedly.
    func prepare() async throws
    func reply(to message: String, history: [ChatMessage], context: ChatContext) -> AsyncThrowingStream<ChatStreamEvent, Error>
}

enum BackendError: LocalizedError {
    case modelNotReady

    var errorDescription: String? {
        switch self {
        case .modelNotReady:
            return "Apple Intelligence não está disponível nesse dispositivo ou a sessão não foi inicializada."
        }
    }
}

struct ChatContext: Sendable {
    let monthSpent: Decimal
    let monthNet: Decimal
    let cards: [CardSnapshot]
    let activeInstallments: [InstallmentSnapshot]
    let categoryBreakdown: [String: Decimal]
    let recentTransactions: [TransactionSnapshot]
    let spendingPatterns: SpendingPatterns?

    static let empty = ChatContext(
        monthSpent: 0,
        monthNet: 0,
        cards: [],
        activeInstallments: [],
        categoryBreakdown: [:],
        recentTransactions: [],
        spendingPatterns: nil
    )

    struct CardSnapshot: Sendable {
        let name: String
        let closingDay: Int
        let dueDay: Int
        let limit: Decimal
        let currentCycleSpend: Decimal
        var daysToClose: Int {
            let today = Calendar.current.component(.day, from: Date())
            return closingDay >= today ? closingDay - today : (30 - today + closingDay)
        }
    }

    struct InstallmentSnapshot: Sendable {
        let merchant: String
        let monthlyAmount: Decimal
        let remainingCount: Int
        let cardName: String?
    }

    struct TransactionSnapshot: Sendable {
        let merchant: String
        let amount: Decimal
        let category: String
        let date: String
    }
}
