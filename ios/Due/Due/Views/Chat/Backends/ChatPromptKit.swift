import Foundation

// Single source of truth for the chat system prompt + JSON output parsing.
// Both LocalLlamaCppBackend and AppleFoundationModelsBackend produce the
// same kinds of structured output (expense proposals, insight cards), and
// they share the same prompt contract so a model swap doesn't change UX.
//
// When FoundationModels' @Generable / Schema constraint API is adopted on
// the Apple tier, that path can stop relying on the JSON-in-prompt
// convention here and constrain outputs at decode time. The Llama tier
// will keep using this until/unless we move to llama.cpp's grammar-based
// constrained decoding.
enum ChatPromptKit {
    static let systemPrompt = """
    Você é Du — coach financeiro brasileiro, direto, calmo, em pt-BR. \
    Responda curto (máx. 2 frases) salvo se o usuário pedir um plano.

    Quando o usuário descrever um GASTO (ex: "iFood 47", "Uber 23,50"), \
    devolva EXATAMENTE este JSON em uma única linha, sem texto extra:
    {"type":"expense","merchant":"<nome>","amount":<número>,"category":"<Delivery|Mercado|Mobilidade|Saúde|Assinaturas|Combustível|Outros>"}

    Quando o usuário pedir análise de hábitos / 6 meses / relatório, devolva:
    {"type":"insight","title":"<titulo curto>","body":"<1-2 frases>","action":"Ver plano","navigateTo":"overview"}

    Caso contrário, responda em texto livre, em pt-BR, no tom do Du.
    """

    struct ParseResult {
        let event: ChatStreamEvent?
        let expectedFreeform: Bool   // true if response wasn't supposed to be JSON anyway
    }

    static func parseStructuredOutput(_ raw: String) -> ParseResult {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.hasPrefix("{"),
              let data = trimmed.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            return ParseResult(event: nil, expectedFreeform: true)
        }

        switch type {
        case "expense":
            guard let merchant = json["merchant"] as? String,
                  let category = json["category"] as? String else {
                return ParseResult(event: nil, expectedFreeform: false)
            }
            let amount = (json["amount"] as? Double) ?? Double((json["amount"] as? Int) ?? 0)
            let timeFormatter = DateFormatter()
            timeFormatter.locale = Locale(identifier: "pt_BR")
            timeFormatter.dateFormat = "HH:mm"
            return ParseResult(event: .structured(.expense(ExpenseProposal(
                merchant: merchant,
                amount: amount,
                category: category,
                date: "Hoje",
                time: timeFormatter.string(from: Date())
            ))), expectedFreeform: false)

        case "insight":
            guard let title = json["title"] as? String,
                  let body = json["body"] as? String else {
                return ParseResult(event: nil, expectedFreeform: false)
            }
            let action = json["action"] as? String
            let navRaw = json["navigateTo"] as? String
            let nav = navRaw.flatMap(AppDestination.init(rawValue:))
            return ParseResult(event: .structured(.insight(ChatInsight(
                title: title, body: body, action: action, navigateTo: nav
            ))), expectedFreeform: false)

        default:
            return ParseResult(event: nil, expectedFreeform: false)
        }
    }
}
