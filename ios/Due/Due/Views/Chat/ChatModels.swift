import Foundation

struct ChatMessage: Identifiable {
    let id = UUID()
    let who: Sender
    var content: Content
    var confirmed: Bool = false   // expense cards only

    enum Sender { case du, me }

    enum Content {
        case text(String)
        case typing
        case suggestions([String])
        case expense(ExpenseProposal)
        case insight(ChatInsight)
    }
}

struct ExpenseProposal {
    let merchant: String
    let amount: Double
    let category: String
    let date: String
    let time: String
}

struct ChatInsight {
    let title: String
    let body: String
    let action: String?
    let navigateTo: AppDestination?    // optional deep-link
}

enum AppDestination: String {
    case home, chat, cartao, overview, notifications, settings, onboarding
}
