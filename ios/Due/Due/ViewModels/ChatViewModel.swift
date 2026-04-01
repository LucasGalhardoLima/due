import Foundation
import Clerk

// MARK: - Card Stream Parser

protocol CardStreamParser {
    func parse(line: String) -> [ChatCard]?
}

/// Parses Vercel AI SDK data stream lines for card JSON.
/// Handles `2:` (data) and `8:` (tool call results) prefixes.
struct SSECardStreamParser: CardStreamParser {
    func parse(line: String) -> [ChatCard]? {
        // Vercel AI SDK: 2: = data, 8: = tool call result
        let payload: String
        if line.hasPrefix("2:") {
            payload = String(line.dropFirst(2))
        } else if line.hasPrefix("8:") {
            payload = String(line.dropFirst(2))
        } else {
            return nil
        }

        guard let data = payload.data(using: .utf8) else { return nil }

        // Try decoding as array of cards first, then single card
        if let cards = try? JSONDecoder().decode([ChatCard].self, from: data) {
            return cards
        }
        if let card = try? JSONDecoder().decode(ChatCard.self, from: data) {
            return [card]
        }
        return nil
    }
}

/// Mock parser that injects sample cards for development.
struct MockCardStreamParser: CardStreamParser {
    func parse(line: String) -> [ChatCard]? { nil }

    static var sampleCards: [ChatCard] {
        [
            .budget(BudgetCard(
                categoryName: "Alimentação",
                limit: 1200,
                actual: 890.50,
                severity: .warning,
                summary: "Você gastou 74% do orçamento de alimentação."
            )),
            .installmentTimeline(InstallmentTimelineCard(
                entries: [
                    TimelineEntry(month: "Abr", year: 2026, amount: 450),
                    TimelineEntry(month: "Mai", year: 2026, amount: 450),
                    TimelineEntry(month: "Jun", year: 2026, amount: 200),
                ],
                totalCommitted: 1100
            )),
            .transactionList(TransactionListCard(
                transactions: [
                    CompactTransaction(description: "iFood", amount: 45.90, date: "28 Mar", category: "Alimentação"),
                    CompactTransaction(description: "Uber", amount: 23.50, date: "27 Mar", category: "Transporte"),
                    CompactTransaction(description: "Netflix", amount: 55.90, date: "25 Mar", category: "Streaming"),
                ]
            )),
            .summary(SummaryCard(
                title: "Resumo do mês",
                pairs: [
                    KeyValuePair(label: "Receita", value: "R$ 8.500,00"),
                    KeyValuePair(label: "Gastos", value: "R$ 5.230,00"),
                    KeyValuePair(label: "Economia", value: "R$ 3.270,00"),
                    KeyValuePair(label: "Parcelas ativas", value: "4"),
                ]
            )),
            .action(ActionCard(
                title: "O que deseja fazer?",
                actions: [
                    CardAction(label: "Criar orçamento", actionType: .createBudget),
                    CardAction(label: "Ver detalhes", actionType: .viewDetail),
                ]
            )),
        ]
    }
}

// MARK: - ChatViewModel

enum PrefillMode {
    case normal
    case quickAddExpense
}

@MainActor
@Observable
final class ChatViewModel {
    var messages: [Message] = []
    var isStreaming = false
    var error: String?
    var errorKind: ErrorKind?
    var prefillMode: PrefillMode = .normal
    var pendingExpense: ParsedExpense?

    private let api = APIClient.shared
    private let cardParser: CardStreamParser = SSECardStreamParser()

    var hasMessages: Bool { !messages.isEmpty }

    // MARK: - Send Message

    func send(_ text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        // Handle quick-add expense mode
        if prefillMode == .quickAddExpense {
            await parseAndConfirmExpense(trimmed)
            return
        }

        let userMessage = Message(role: .user, content: trimmed)
        messages.append(userMessage)

        let assistantMessage = Message(role: .assistant, content: "")
        messages.append(assistantMessage)
        isStreaming = true
        error = nil
        errorKind = nil

        do {
            try await streamResponse(for: trimmed, into: assistantMessage.id)
        } catch {
            // Remove empty assistant message on failure
            if let idx = messages.lastIndex(where: { $0.id == assistantMessage.id }),
               messages[idx].content.isEmpty && messages[idx].cards.isEmpty {
                messages.remove(at: idx)
            }
            self.error = error.localizedDescription
            self.errorKind = (error as? APIError)?.kind ?? .loadFailure
        }

        isStreaming = false
    }

    // MARK: - Parse Expense

    func parseAndConfirmExpense(_ text: String) async {
        isStreaming = true
        error = nil
        errorKind = nil

        do {
            let dateFormatter = ISO8601DateFormatter()
            dateFormatter.formatOptions = [.withFullDate]
            let currentDate = dateFormatter.string(from: Date())

            let request = AIParseRequest(text: text, currentDate: currentDate)
            let response: AIParseResponse = try await api.request(Endpoint.parseExpense(), body: request)

            guard let description = response.description,
                  let amount = response.amount,
                  let date = response.date else {
                throw APIError.decodingError(NSError(domain: "ParseExpense", code: 0, userInfo: [NSLocalizedDescriptionKey: "Não consegui entender o gasto. Tente algo como: Uber R$25 ontem"]))
            }

            let decimal = Decimal(amount)
            pendingExpense = ParsedExpense(
                description: description,
                amount: decimal,
                date: date,
                categoryId: response.categoryId,
                cardId: response.cardId,
                transactionId: nil
            )

            // Exit quick-add mode after parsing
            prefillMode = .normal
        } catch {
            self.error = error.localizedDescription
            self.errorKind = (error as? APIError)?.kind ?? .loadFailure
        }

        isStreaming = false
    }

    // MARK: - Transaction Actions

    func saveExpense() async {
        guard let expense = pendingExpense else { return }

        isStreaming = true
        error = nil

        let request = CreateTransactionRequest(
            description: expense.description,
            amount: Double(truncating: expense.amount as NSDecimalNumber),
            purchaseDate: expense.date,
            installmentsCount: 1,
            cardId: expense.cardId ?? "",
            categoryId: expense.categoryId,
            isSubscription: false
        )

        do {
            let response: TransactionResponse = try await api.request(Endpoint.createTransaction(), body: request)

            // Store transaction ID for undo
            pendingExpense?.transactionId = response.id

            // Add success message
            let successMessage = Message(role: .assistant, content: "Pronto! \(expense.description) \(expense.displayAmount) adicionado.")
            messages.append(successMessage)

        } catch {
            let apiError = error as? APIError
            if apiError?.kind == .offline {
                // Queue for later sync
                OfflineTransactionQueue.shared.enqueue(request)
                pendingExpense = nil

                let queuedMessage = Message(role: .assistant, content: "Você está offline. O gasto \(expense.description) \(expense.displayAmount) será salvo quando a conexão voltar.")
                messages.append(queuedMessage)
            } else {
                self.error = error.localizedDescription
                self.errorKind = apiError?.kind ?? .loadFailure
            }
        }

        isStreaming = false
    }

    func undoExpense() async {
        guard let transactionId = pendingExpense?.transactionId else { return }

        isStreaming = true
        error = nil

        do {
            struct EmptyResponse: Decodable {}
            let _: EmptyResponse = try await api.request(Endpoint.deleteTransaction(id: transactionId))

            // Remove success message
            if let lastMessage = messages.last, lastMessage.role == .assistant, lastMessage.content.contains("Pronto!") {
                messages.removeLast()
            }

            pendingExpense = nil
        } catch {
            self.error = error.localizedDescription
            self.errorKind = (error as? APIError)?.kind ?? .loadFailure
        }

        isStreaming = false
    }

    func clearPendingExpense() {
        pendingExpense = nil
    }

    func enterQuickAddMode() {
        prefillMode = .quickAddExpense
    }

    // MARK: - Action Handling

    func handleCardAction(_ action: CardAction) async {
        switch action.actionType {
        case .createBudget:
            await send("Criar orçamento para \(action.payload ?? "categoria")")
        case .viewDetail:
            await send("Mostrar detalhes de \(action.payload ?? "item")")
        case .confirm:
            await send("Confirmar \(action.payload ?? "ação")")
        }
    }

    // MARK: - SSE Streaming

    private func streamResponse(for prompt: String, into messageId: UUID) async throws {
        guard let token = try await Clerk.shared.session?.getToken()?.jwt else {
            throw APIError.noSession
        }

        let endpoint = Endpoint.chatStream()
        guard let url = endpoint.url else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ChatRequest(
            messages: messages.dropLast().map { ChatRequest.RequestMessage(role: $0.role.rawValue, content: $0.content) }
        )
        request.httpBody = try JSONEncoder().encode(body)

        let (bytes, response) = try await URLSession.shared.bytes(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
            throw APIError.httpError(statusCode: statusCode, message: "Chat request failed")
        }

        for try await line in bytes.lines {
            // Text chunks: "0:\"text chunk\"\n"
            if line.hasPrefix("0:") {
                let payload = String(line.dropFirst(2))
                if let data = payload.data(using: .utf8),
                   let text = try? JSONDecoder().decode(String.self, from: data) {
                    if let idx = messages.firstIndex(where: { $0.id == messageId }) {
                        messages[idx].content += text
                    }
                }
                continue
            }

            // Card data: "2:" (data) or "8:" (tool results)
            if let cards = cardParser.parse(line: line) {
                if let idx = messages.firstIndex(where: { $0.id == messageId }) {
                    messages[idx].cards.append(contentsOf: cards)
                }
            }
        }
    }

    // MARK: - Clear

    func clearChat() {
        messages.removeAll()
        error = nil
        errorKind = nil
    }
}

// MARK: - Request Types

private struct ChatRequest: Encodable {
    let messages: [RequestMessage]

    struct RequestMessage: Encodable {
        let role: String
        let content: String
    }
}

// MARK: - Parsed Expense

struct ParsedExpense: Equatable {
    let description: String
    let amount: Decimal
    let date: String
    let categoryId: String?
    let cardId: String?
    var transactionId: String?

    var displayAmount: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "BRL"
        formatter.locale = Locale(identifier: "pt_BR")
        return formatter.string(from: amount as NSDecimalNumber) ?? "R$ 0,00"
    }
}
