import Foundation
import Observation
import SwiftData

@MainActor
@Observable
final class ChatViewModel {
    var thread: [ChatMessage] = [
        ChatMessage(who: .du, content: .text("Oi! Em que posso ajudar hoje?")),
        ChatMessage(who: .du, content: .suggestions([
            "Adicionar gasto",
            "Como tô esse mês?",
            "Análise de 6 meses"
        ]))
    ]
    var draft: String = ""

    /// Set by RootView; lets the chat trigger navigation (insight cards / overview punt).
    var onNavigate: (AppDestination) -> Void = { _ in }

    /// Injected by ChatView from `@Environment(\.modelContext)`. Confirmed
    /// expense proposals are written here as real Transaction rows. Nil only
    /// in tests that bypass the SwiftData container on purpose.
    var modelContext: ModelContext?

    /// User's backend preference. `.auto` lets ChatBackendResolver pick the
    /// best tier for the device at runtime. DEBUG-only Settings can override.
    var backendKind: ChatBackendKind = .auto {
        didSet { rebuildBackend() }
    }

    private var backend: any ChatBackend = RuleBasedBackend()
    private let fallback: any ChatBackend = RuleBasedBackend()
    private var inflightTask: Task<Void, Never>?
    private var prepareTask: Task<Void, Never>?

    // MARK: - Edit-mode state
    private var pendingEditMessageID: UUID?

    init(initialBackend: ChatBackendKind = .auto) {
        self.backendKind = initialBackend
        rebuildBackend()
    }

    // MARK: - User actions

    func send(_ overrideText: String? = nil) {
        let raw = (overrideText ?? draft).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !raw.isEmpty else { return }

        // Handle corrected amount in edit mode BEFORE anything else.
        if let editID = pendingEditMessageID,
           let amount = Decimal(string: raw.replacingOccurrences(of: ",", with: "."), locale: Locale(identifier: "en_US")),
           amount > 0,
           let idx = thread.firstIndex(where: { $0.id == editID }),
           case .expense(let p) = thread[idx].content {
            thread[idx].content = .expense(ExpenseProposal(
                merchant: p.merchant,
                amount: amount,
                category: p.category,
                date: p.date,
                time: p.time
            ))
            pendingEditMessageID = nil
            draft = ""
            thread.append(ChatMessage(who: .me, content: .text(raw)))
            thread.append(ChatMessage(who: .du, content: .text("Valor corrigido.")))
            return
        }

        thread.append(ChatMessage(who: .me, content: .text(raw)))
        draft = ""

        // Deterministic fast path: a recognized "merchant amount" goes
        // straight to an expense card with no model warmup or typing dot.
        // The backend only gets free-form text it can actually help with.
        if let proposal = ExpenseQuickParser.parse(raw) {
            thread.append(ChatMessage(who: .du, content: .expense(proposal)))
            return
        }

        respond(to: raw)
    }

    func confirmExpense(messageID: UUID) {
        guard let idx = thread.firstIndex(where: { $0.id == messageID }),
              case .expense(let proposal) = thread[idx].content else { return }
        // Guard against double-confirm (e.g. user taps twice quickly).
        guard !thread[idx].confirmed else { return }
        thread[idx].confirmed = true

        // Negative amount = expense (Transaction.swift sign convention).
        // We coerce here so a bug in any backend that emits positive can't
        // accidentally write an income row.
        if let ctx = modelContext {
            let expenseAmount = -abs(proposal.amount)
            let txn = Transaction(
                merchant: proposal.merchant,
                amount: expenseAmount,
                category: proposal.category,
                timestamp: proposal.proposedDate()
            )
            ctx.insert(txn)
            do {
                try ctx.save()
            } catch {
                thread.append(ChatMessage(who: .du, content: .text("Não consegui salvar o gasto. Tenta de novo.")))
                return
            }
        }

        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(300))
            thread.append(ChatMessage(who: .du, content: .text("Anotado. Categorizei e tá no teu mês.")))
        }
    }

    func editExpense(messageID: UUID) {
        pendingEditMessageID = messageID
        guard let idx = thread.firstIndex(where: { $0.id == messageID }),
              case .expense(let proposal) = thread[idx].content else { return }
        thread.append(ChatMessage(who: .du, content: .text("O que você quer ajustar em \(proposal.merchant)?")))
        thread.append(ChatMessage(who: .du, content: .suggestions(["Corrigir valor", "Mudar categoria", "Cancelar"])))
    }

    func suggestionTapped(_ suggestion: String) {
        // Navigation chips bypass the backend entirely.
        switch suggestion {
        case "Ver cartão", "Cartão": onNavigate(.cartao); return
        case "Análise de 6 meses": onNavigate(.overview); return
        default: break
        }

        // Handle edit-mode suggestions BEFORE passing to send().
        if let editID = pendingEditMessageID {
            let categories = ["Delivery", "Mercado", "Mobilidade", "Saúde", "Assinaturas", "Combustível", "Outros"]
            switch suggestion {
            case "Cancelar":
                pendingEditMessageID = nil
                thread.append(ChatMessage(who: .du, content: .text("Ok, mantive o gasto original.")))
                return
            case "Corrigir valor":
                thread.append(ChatMessage(who: .du, content: .text("Qual o valor correto?")))
                return
            case "Mudar categoria":
                thread.append(ChatMessage(who: .du, content: .suggestions(categories)))
                return
            default:
                if categories.contains(suggestion),
                   let idx = thread.firstIndex(where: { $0.id == editID }),
                   case .expense(let p) = thread[idx].content {
                    thread[idx].content = .expense(ExpenseProposal(
                        merchant: p.merchant,
                        amount: p.amount,
                        category: suggestion,
                        date: p.date,
                        time: p.time
                    ))
                    pendingEditMessageID = nil
                    thread.append(ChatMessage(who: .du, content: .text("Categoria atualizada para \(suggestion).")))
                    return
                }
            }
        }
        send(suggestion)
    }

    func insightActionTapped(_ destination: AppDestination?) {
        if let destination { onNavigate(destination) }
    }

    // MARK: - Backend driver

    private func rebuildBackend() {
        backend = Self.instantiate(kind: backendKind)
        // Best-effort warm-up. If `prepare()` throws (model missing, OOM, etc.)
        // we surface it once as a chat bubble so the user knows replies will
        // come from the rules fallback for this turn onward.
        let captured = backend
        prepareTask?.cancel()
        prepareTask = Task { @MainActor in
            do {
                try await captured.prepare()
            } catch {
                self.thread.append(ChatMessage(
                    who: .du,
                    content: .text("Modelo local indisponível (\(error.localizedDescription)). Vou usar regras enquanto isso.")
                ))
            }
        }
    }

    private func respond(to message: String) {
        inflightTask?.cancel()

        // Show typing while we wait for the first token.
        let typingMessage = ChatMessage(who: .du, content: .typing)
        thread.append(typingMessage)

        let primary = backend
        let fallback = self.fallback
        let history = thread
        let chatCtx = buildChatContext()

        inflightTask = Task { @MainActor in
            // Guarantee the typing dot is gone on every exit path — silent
            // finish, throw, or cancel. Without this the UI gets stuck
            // showing "Du is typing" forever.
            defer { removeTyping() }

            var streamingMessage: ChatMessage?
            var assembled = ""
            var lastStructured: StructuredOutput?
            var emittedSomething = false
            var finalStats: BackendStats?

            do {
                for try await event in primary.reply(to: message, history: history, context: chatCtx) {
                    if Task.isCancelled { return }
                    Self.handle(event,
                                thread: &thread,
                                streamingMessage: &streamingMessage,
                                assembled: &assembled,
                                lastStructured: &lastStructured,
                                emittedSomething: &emittedSomething,
                                finalStats: &finalStats)
                }
            } catch {
                emittedSomething = false  // force fallback below
            }

            // If the model produced nothing visible (silent finish, error, or
            // empty text), fall back to rules so the user always gets a reply.
            if !emittedSomething {
                do {
                    for try await event in fallback.reply(to: message, history: history, context: chatCtx) {
                        if Task.isCancelled { return }
                        Self.handle(event,
                                    thread: &thread,
                                    streamingMessage: &streamingMessage,
                                    assembled: &assembled,
                                    lastStructured: &lastStructured,
                                    emittedSomething: &emittedSomething,
                                    finalStats: &finalStats)
                    }
                } catch {
                    thread.append(ChatMessage(who: .du, content: .text("Errei aqui — \(error.localizedDescription)")))
                }
            }

            #if DEBUG
            // Benchmark logging persists prompts + raw responses to
            // Documents/du-chat-benchmark.jsonl. Useful for tuning the
            // local models but personal data — keep RELEASE silent.
            if let stats = finalStats {
                ChatBenchmarkLogger.log(.init(
                    backend: primary.kind,
                    prompt: message,
                    rawResponse: assembled,
                    structured: lastStructured,
                    stats: stats
                ))
            }
            #endif
        }
    }

    // MARK: - Context builder

    private func buildChatContext() -> ChatContext {
        guard let ctx = modelContext else { return .empty }

        let now = Date()
        let cal = Calendar.current
        let startOfMonth = cal.date(from: cal.dateComponents([.year, .month], from: now)) ?? now

        // Fetch transactions this month
        let txDescriptor = FetchDescriptor<Transaction>(
            predicate: #Predicate { $0.timestamp >= startOfMonth }
        )
        let transactions = (try? ctx.fetch(txDescriptor)) ?? []

        let monthSpent = transactions.filter { $0.amount < 0 }.reduce(Decimal(0)) { $0 + abs($1.amount) }
        let monthIncome = transactions.filter { $0.amount > 0 }.reduce(Decimal(0)) { $0 + $1.amount }

        var byCategory: [String: Decimal] = [:]
        for tx in transactions where tx.amount < 0 {
            byCategory[tx.category, default: 0] += abs(tx.amount)
        }

        // Fetch cards
        let cards = (try? ctx.fetch(FetchDescriptor<Card>())) ?? []
        let cardSnapshots = cards.map { card -> ChatContext.CardSnapshot in
            let cardTxs = transactions.filter { $0.card?.id == card.id && $0.amount < 0 }
            let cycleSpend = cardTxs.reduce(Decimal(0)) { $0 + abs($1.amount) }
            return ChatContext.CardSnapshot(
                name: card.name,
                closingDay: card.closingDay,
                dueDay: card.dueDay,
                limit: card.limit,
                currentCycleSpend: cycleSpend
            )
        }

        // Fetch active installments
        let installments = (try? ctx.fetch(FetchDescriptor<Installment>())) ?? []
        let activeInstallments = installments.compactMap { inst -> ChatContext.InstallmentSnapshot? in
            let months = inst.installmentCount
            guard months > 0,
                  let endDate = cal.date(byAdding: .month, value: months, to: inst.firstDate),
                  endDate > now else { return nil }
            let monthsRemaining = cal.dateComponents([.month], from: now, to: endDate).month ?? 0
            let monthlyAmount = months > 0 ? inst.totalAmount / Decimal(months) : 0
            return ChatContext.InstallmentSnapshot(
                merchant: inst.merchant,
                monthlyAmount: monthlyAmount,
                remainingCount: monthsRemaining,
                cardName: inst.card?.name
            )
        }

        let shortDateFormatter = DateFormatter()
        shortDateFormatter.dateFormat = "dd/MM"
        shortDateFormatter.locale = Locale(identifier: "pt_BR")

        let recent = transactions
            .sorted { $0.timestamp > $1.timestamp }
            .prefix(10)
            .map {
                ChatContext.TransactionSnapshot(
                    merchant: $0.merchant,
                    amount: $0.amount,
                    category: $0.category,
                    date: shortDateFormatter.string(from: $0.timestamp)
                )
            }

        // Pattern analysis over the last 30 days (wider than current month to
        // give the analyzer enough baseline even early in a billing cycle).
        let thirtyDaysAgo = cal.date(byAdding: .day, value: -30, to: now) ?? now
        let patternDescriptor = FetchDescriptor<Transaction>(
            predicate: #Predicate { $0.timestamp >= thirtyDaysAgo }
        )
        let patternTxns = (try? ctx.fetch(patternDescriptor)) ?? []
        let patternInputs = patternTxns.map {
            PatternInput(timestamp: $0.timestamp, amount: $0.amount,
                        category: $0.category, merchant: $0.merchant)
        }
        let spendingPatterns = SpendingPatternAnalyzer.analyze(patternInputs)

        return ChatContext(
            monthSpent: monthSpent,
            monthNet: monthIncome - monthSpent,
            cards: cardSnapshots,
            activeInstallments: activeInstallments,
            categoryBreakdown: byCategory,
            recentTransactions: Array(recent),
            spendingPatterns: spendingPatterns
        )
    }

    // MARK: - Event handler (static to avoid Law of Exclusivity violations)

    // Static + inout-only: `thread` is the single mutation path, so we
    // can never alias self.thread through a captured closure. Earlier
    // versions passed a `removeTyping: () -> Void` that called back into
    // self, which trips Swift's Law of Exclusivity (SIGABRT on iOS 26
    // Release builds) because self.thread and the inout `thread` point
    // at the same storage.
    private static func handle(
        _ event: ChatStreamEvent,
        thread: inout [ChatMessage],
        streamingMessage: inout ChatMessage?,
        assembled: inout String,
        lastStructured: inout StructuredOutput?,
        emittedSomething: inout Bool,
        finalStats: inout BackendStats?
    ) {
        switch event {
        case .textChunk(let delta):
            dropTyping(from: &thread)
            if streamingMessage == nil {
                let m = ChatMessage(who: .du, content: .text(""))
                streamingMessage = m
                thread.append(m)
            }
            assembled += delta
            if let id = streamingMessage?.id,
               let i = thread.firstIndex(where: { $0.id == id }) {
                thread[i].content = .text(assembled)
            }
            emittedSomething = true

        case .finalText(let text):
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty { return }   // skip empty finals (model bailed)
            dropTyping(from: &thread)
            if let id = streamingMessage?.id,
               let i = thread.firstIndex(where: { $0.id == id }) {
                thread[i].content = .text(trimmed)
            } else {
                thread.append(ChatMessage(who: .du, content: .text(trimmed)))
            }
            streamingMessage = nil
            assembled = trimmed
            emittedSomething = true

        case .structured(let s):
            dropTyping(from: &thread)
            switch s {
            case .expense(let e):
                thread.append(ChatMessage(who: .du, content: .expense(e)))
            case .insight(let i):
                thread.append(ChatMessage(who: .du, content: .insight(i)))
            }
            lastStructured = s
            emittedSomething = true

        case .suggestions(let chips):
            dropTyping(from: &thread)
            thread.append(ChatMessage(who: .du, content: .suggestions(chips)))
            emittedSomething = true

        case .done(let stats):
            finalStats = stats
        }
    }

    private static func dropTyping(from thread: inout [ChatMessage]) {
        thread.removeAll {
            if case .typing = $0.content { return true } else { return false }
        }
    }

    // MARK: - Backend instantiation

    // `.auto` defers to ChatBackendResolver. The explicit cases are
    // dev overrides: if the user (well, dev) forces a tier that isn't
    // actually available on this device, we drop to rules silently
    // rather than crashing or shipping an empty reply.
    private static func instantiate(kind: ChatBackendKind) -> any ChatBackend {
        switch kind {
        case .auto:
            return ChatBackendResolver.resolve()
        case .ruleBased:
            return RuleBasedBackend()
        case .appleFoundationModels:
            #if canImport(FoundationModels)
            if ChatBackendResolver.isFoundationModelsAvailable() {
                return AppleFoundationModelsBackend()
            }
            #endif
            return RuleBasedBackend()
        }
    }

    private func removeTyping() {
        thread.removeAll {
            if case .typing = $0.content { return true } else { return false }
        }
    }
}
