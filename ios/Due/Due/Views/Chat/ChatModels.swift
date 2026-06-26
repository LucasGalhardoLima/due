import Foundation

struct ChatMessage: Identifiable, Sendable {
    let id = UUID()
    let who: Sender
    var content: Content
    var confirmed: Bool = false   // expense cards only

    enum Sender: Sendable { case du, me }

    enum Content: Sendable {
        case text(String)
        case typing
        case suggestions([String])
        case expense(ExpenseProposal)
        case insight(ChatInsight)
    }
}

// Constitution Principle 3: currency is Decimal end-to-end. The chat
// surface (rules / Llama JSON / FoundationModels) was using Double; this
// is now the source of truth and every emit/consume site is responsible
// for staying in Decimal.
struct ExpenseProposal: Sendable {
    let merchant: String
    let amount: Decimal
    let category: String
    let date: String      // "Hoje" / "Ontem" / "dd/MM"  — see proposedDate()
    let time: String      // "HH:mm"
}

struct ChatInsight: Sendable {
    let title: String
    let body: String
    let action: String?
    let navigateTo: AppDestination?    // optional deep-link
}

enum AppDestination: String, Sendable {
    case home, chat, cartao, overview, notifications, settings, onboarding
}
