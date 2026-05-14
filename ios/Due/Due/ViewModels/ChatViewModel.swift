import Foundation
import Observation

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

    /// User's backend preference. `.auto` lets ChatBackendResolver pick the
    /// best tier for the device at runtime. DEBUG-only Settings can override.
    var backendKind: ChatBackendKind = .auto {
        didSet { rebuildBackend() }
    }

    private var backend: any ChatBackend = RuleBasedBackend()
    private let fallback: any ChatBackend = RuleBasedBackend()
    private var inflightTask: Task<Void, Never>?

    init(initialBackend: ChatBackendKind = .auto) {
        self.backendKind = initialBackend
        rebuildBackend()
    }

    // MARK: - User actions

    func send(_ overrideText: String? = nil) {
        let raw = (overrideText ?? draft).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !raw.isEmpty else { return }
        thread.append(ChatMessage(who: .me, content: .text(raw)))
        draft = ""
        respond(to: raw)
    }

    func confirmExpense(messageID: UUID) {
        guard let idx = thread.firstIndex(where: { $0.id == messageID }) else { return }
        thread[idx].confirmed = true
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(300))
            thread.append(ChatMessage(who: .du, content: .text("Anotado. Categorizei e tá no teu mês.")))
        }
    }

    func editExpense(messageID _: UUID) {
        thread.append(ChatMessage(who: .du, content: .text("Beleza, em qual categoria?")))
        thread.append(ChatMessage(who: .du, content: .suggestions(["Delivery", "Mercado", "Saúde", "Outros"])))
    }

    func suggestionTapped(_ suggestion: String) { send(suggestion) }
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
        Task { @MainActor in
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
                for try await event in primary.reply(to: message, history: history) {
                    if Task.isCancelled { return }
                    Self.handle(event,
                                thread: &thread,
                                streamingMessage: &streamingMessage,
                                assembled: &assembled,
                                lastStructured: &lastStructured,
                                emittedSomething: &emittedSomething,
                                finalStats: &finalStats,
                                removeTyping: { self.removeTyping() })
                }
            } catch {
                emittedSomething = false  // force fallback below
            }

            // If the model produced nothing visible (silent finish, error, or
            // empty text), fall back to rules so the user always gets a reply.
            if !emittedSomething {
                do {
                    for try await event in fallback.reply(to: message, history: history) {
                        if Task.isCancelled { return }
                        Self.handle(event,
                                    thread: &thread,
                                    streamingMessage: &streamingMessage,
                                    assembled: &assembled,
                                    lastStructured: &lastStructured,
                                    emittedSomething: &emittedSomething,
                                    finalStats: &finalStats,
                                    removeTyping: { self.removeTyping() })
                    }
                } catch {
                    thread.append(ChatMessage(who: .du, content: .text("Errei aqui — \(error.localizedDescription)")))
                }
            }

            if let stats = finalStats {
                ChatBenchmarkLogger.log(.init(
                    backend: primary.kind,
                    prompt: message,
                    rawResponse: assembled,
                    structured: lastStructured,
                    stats: stats
                ))
            }
        }
    }

    /// Static so it can take inout params without capturing self in the loop.
    private static func handle(
        _ event: ChatStreamEvent,
        thread: inout [ChatMessage],
        streamingMessage: inout ChatMessage?,
        assembled: inout String,
        lastStructured: inout StructuredOutput?,
        emittedSomething: inout Bool,
        finalStats: inout BackendStats?,
        removeTyping: () -> Void
    ) {
        switch event {
        case .textChunk(let delta):
            removeTyping()
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
            removeTyping()
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
            removeTyping()
            switch s {
            case .expense(let e):
                thread.append(ChatMessage(who: .du, content: .expense(e)))
            case .insight(let i):
                thread.append(ChatMessage(who: .du, content: .insight(i)))
            }
            lastStructured = s
            emittedSomething = true

        case .suggestions(let chips):
            removeTyping()
            thread.append(ChatMessage(who: .du, content: .suggestions(chips)))
            emittedSomething = true

        case .done(let stats):
            finalStats = stats
        }
    }

    // MARK: - Backend instantiation

    // `.auto` defers to ChatBackendResolver — added in the next slice when
    // the Apple FoundationModels backend lands. For now, `.auto` falls
    // through to the llama path when a GGUF is bundled, else rule-based.
    private static func instantiate(kind: ChatBackendKind) -> any ChatBackend {
        switch kind {
        case .ruleBased:
            return RuleBasedBackend()
        case .appleFoundationModels:
            // Concrete backend type lands with the resolver commit; until
            // then, force-selecting this in DEBUG drops to rules so the
            // user still gets a reply.
            return RuleBasedBackend()
        case .llamaQwen06b, .auto:
            if let config = LocalModelCatalog.config(for: .llamaQwen06b),
               Bundle.main.url(
                   forResource: (config.ggufFileName as NSString).deletingPathExtension,
                   withExtension: "gguf"
               ) != nil {
                return LocalLlamaCppBackend(kind: .llamaQwen06b, config: config)
            }
            return RuleBasedBackend()
        }
    }

    private func removeTyping() {
        thread.removeAll {
            if case .typing = $0.content { return true } else { return false }
        }
    }
}
