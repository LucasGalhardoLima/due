#if canImport(FoundationModels)
import Foundation
import FoundationModels

// ─── @Generable output types ──────────────────────────────────────────────
//
// These replace the JSON-in-prompt convention used by the legacy llama.cpp
// tier. FoundationModels enforces the schema at decode time, so we don't
// need to ask the model to produce JSON or parse it ourselves.

@available(iOS 26.0, *)
@Generable
enum DuChatIntent: String {
    case expense    // user is logging a purchase or payment
    case insight    // user asked for financial analysis / trends / monthly summary
    case chat       // everything else: greetings, follow-ups, questions
}

@available(iOS 26.0, *)
@Generable
enum DuExpenseCategory: String {
    case delivery    = "Delivery"
    case mercado     = "Mercado"
    case mobilidade  = "Mobilidade"
    case saude       = "Saúde"
    case assinaturas = "Assinaturas"
    case combustivel = "Combustível"
    case outros      = "Outros"
}

@available(iOS 26.0, *)
@Generable
struct DuResponse {
    @Guide(description: """
        Classify the user message:
        'expense' — user described spending money (e.g. "gastei 47 no iFood", "Uber 23,50").
        'insight' — user asked for financial analysis, trends, or a monthly report.
        'chat'    — greetings, questions, follow-ups, and everything else.
        """)
    var intent: DuChatIntent

    // ── expense fields (populated only when intent == .expense) ────────────
    @Guide(description: "Merchant or service name in Portuguese. Required when intent is expense.")
    var merchant: String?

    @Guide(description: "Transaction amount in Brazilian Reais as a decimal number (e.g. 47.5). Required when intent is expense.")
    var amount: Double?

    @Guide(description: "Best matching spending category. Required when intent is expense.")
    var category: DuExpenseCategory?

    // ── insight fields (populated only when intent == .insight) ────────────
    @Guide(description: "Short insight title in Portuguese, max 6 words. Required when intent is insight.")
    var insightTitle: String?

    @Guide(description: "1-2 sentence financial insight in Portuguese, direct and actionable. Required when intent is insight.")
    var insightBody: String?

    // ── chat field (populated only when intent == .chat) ──────────────────
    @Guide(description: "Conversational reply in Brazilian Portuguese, max 2 sentences. Required when intent is chat.")
    var chatReply: String?
}

// ─── Backend ──────────────────────────────────────────────────────────────

@available(iOS 26.0, *)
@MainActor
final class AppleFoundationModelsBackend: ChatBackend, Sendable {
    nonisolated let kind: ChatBackendKind = .appleFoundationModels

    // LanguageModelSession maintains the conversation transcript natively.
    // A new session is created once in prepare() and reused across turns so
    // the model has full context of the current chat session.
    private var session: LanguageModelSession?

    func prepare() async throws {
        guard session == nil else { return }
        guard SystemLanguageModel.default.availability == .available else {
            throw BackendError.modelNotReady
        }
        session = LanguageModelSession(instructions: Self.instructions)
    }

    // `history` is passed in but LanguageModelSession manages the transcript
    // internally — we don't re-inject history on every call. The session
    // accumulates turns automatically from the point it was created.
    // `context` is injected as a preamble prepended to the user message so
    // the model has live financial data without needing server calls.
    nonisolated func reply(to message: String, history _: [ChatMessage], context: ChatContext) -> AsyncThrowingStream<ChatStreamEvent, Error> {
        AsyncThrowingStream { continuation in
            Task { @MainActor in
                do {
                    try await self.prepare()
                    guard let session = self.session else {
                        continuation.finish(throwing: BackendError.modelNotReady)
                        return
                    }

                    let start = DispatchTime.now()

                    let preamble = self.contextPreamble(context)
                    let fullMessage = preamble.isEmpty ? message : "\(preamble)\n---\nMensagem: \(message)"

                    // Single structured call — @Generable enforces intent +
                    // typed output at decode time; no JSON string parsing needed.
                    let result = try await session.respond(
                        to: fullMessage,
                        generating: DuResponse.self
                    )
                    let response = result.content

                    let firstTokenMs = Int(Double(
                        DispatchTime.now().uptimeNanoseconds - start.uptimeNanoseconds
                    ) / 1_000_000)

                    switch response.intent {
                    case .expense:
                        if let merchant = response.merchant, let amount = response.amount {
                            let timeFormatter = DateFormatter()
                            timeFormatter.locale = Locale(identifier: "pt_BR")
                            timeFormatter.dateFormat = "HH:mm"
                            let proposal = ExpenseProposal(
                                merchant: merchant,
                                amount: Decimal(amount),
                                category: response.category?.rawValue ?? "Outros",
                                date: "Hoje",
                                time: timeFormatter.string(from: Date())
                            )
                            continuation.yield(.structured(.expense(proposal)))
                        } else {
                            // Model classified as expense but fields are missing —
                            // ask the user to clarify.
                            continuation.yield(.finalText("Pode me passar o valor e o nome do gasto?"))
                        }

                    case .insight:
                        if let title = response.insightTitle, let body = response.insightBody {
                            let insight = ChatInsight(
                                title: title,
                                body: body,
                                action: "Ver plano",
                                navigateTo: .overview
                            )
                            continuation.yield(.structured(.insight(insight)))
                            continuation.yield(.suggestions([
                                "Mais detalhes",
                                "Como resolver isso",
                                "Ver relatório completo"
                            ]))
                        } else {
                            continuation.yield(.finalText("Deixa eu analisar seus dados — pode demorar um segundo."))
                        }

                    case .chat:
                        let reply = (response.chatReply ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                        if !reply.isEmpty {
                            continuation.yield(.finalText(reply))
                        }
                    }

                    let totalMs = Int(Double(
                        DispatchTime.now().uptimeNanoseconds - start.uptimeNanoseconds
                    ) / 1_000_000)
                    continuation.yield(.done(BackendStats(
                        firstTokenMs: firstTokenMs,
                        totalMs: totalMs,
                        outputTokens: 0,
                        parseSuccess: true
                    )))
                    continuation.finish()

                } catch {
                    session = nil
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    // MARK: - Context injection

    private func contextPreamble(_ ctx: ChatContext) -> String {
        guard ctx.monthSpent > 0 || !ctx.cards.isEmpty || ctx.spendingPatterns != nil else { return "" }
        var lines = ["[DADOS DO MÊS]"]
        lines.append("Gasto: R$ \(ctx.monthSpent)")
        if ctx.monthNet != 0 { lines.append("Saldo: R$ \(ctx.monthNet)") }
        if !ctx.cards.isEmpty {
            lines.append("Cartões:")
            for c in ctx.cards {
                lines.append("  \(c.name): R$ \(c.currentCycleSpend)/R$ \(c.limit), fecha em \(c.daysToClose) dias")
            }
        }
        if !ctx.activeInstallments.isEmpty {
            lines.append("Parcelamentos ativos:")
            for i in ctx.activeInstallments {
                lines.append("  \(i.merchant): R$ \(i.monthlyAmount)/mês, \(i.remainingCount) restantes")
            }
        }
        if !ctx.categoryBreakdown.isEmpty {
            let top = ctx.categoryBreakdown.sorted { $0.value > $1.value }.prefix(3)
            let summary = top.map { "\($0.key): R$ \($0.value)" }.joined(separator: ", ")
            lines.append("Top categorias: \(summary)")
        }
        if let p = ctx.spendingPatterns, p.hasConvergentSignal {
            lines.append("[PADRÕES DE COMPORTAMENTO]")
            if p.activeFlags.contains(.lateNight) {
                let pct = Int(p.lateNightRatio * 100)
                lines.append("  \(pct)% das compras acontecem depois das 22h")
            }
            if p.activeFlags.contains(.velocitySpike) {
                let pct = Int(min(p.velocityDelta * 100, 999))
                lines.append("  Ritmo de compras acelerou +\(pct)% essa semana vs média")
            }
            if p.activeFlags.contains(.categoryFixation) {
                let pct = Int(p.topCategoryShare * 100)
                lines.append("  \(pct)% do gasto concentrado em \(p.topCategory)")
            }
            if p.activeFlags.contains(.bursty) {
                lines.append("  Compras aparecem em rajadas em vez de distribuídas no tempo")
            }
            if p.activeFlags.contains(.merchantRepeat) {
                lines.append("  Alta taxa de retorno aos mesmos estabelecimentos essa semana")
            }
            lines.append("  → Quando relevante, observe um padrão e pergunte se o usuário quer explorar. Nunca diagnostique.")
        }
        return lines.joined(separator: "\n")
    }

    // Natural-language instructions — no JSON format directives needed here
    // because @Generable enforces output structure at the framework level.
    private static let instructions = """
    Você é Du — coach financeiro brasileiro, direto e prático. \
    Responda sempre em pt-BR. Seja breve: máximo 2 frases em respostas conversacionais. \
    Para análises financeiras ou planos, pode elaborar mais. \
    Tom casual e empático — você entende a ansiedade financeira brasileira.
    """
}

#endif
