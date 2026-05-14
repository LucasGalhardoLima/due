import Foundation
import LocalLLMClient
import LocalLLMClientLlama

// On-device LLM backend using llama.cpp via LocalLLMClient. Loads a
// Q4_K_M GGUF from the app bundle and streams replies back as token
// chunks. Each instance owns one model — switching models in Settings
// constructs a new instance and lets ARC drop the previous one.
//
// Why llama.cpp over MLX: on A13 (iPhone 11) MLX's quantized matmul
// kernels jetsam the Metal compiler service. llama.cpp memory-maps the
// GGUF and uses NEON/Accelerate on CPU — far friendlier on 4 GB RAM.
@MainActor
final class LocalLlamaCppBackend: ChatBackend, Sendable {
    nonisolated let kind: ChatBackendKind
    let config: ModelConfig

    // We hold the type-erased AnyLLMClient so the stream Element resolves
    // to `String` (the protocol's associated type would be `Any` through
    // an existential, breaking compilation).
    private var client: AnyLLMClient?

    private static let systemPrompt = """
    Você é Du — coach financeiro brasileiro, direto, calmo, em pt-BR. \
    Responda curto (máx. 2 frases) salvo se o usuário pedir um plano.

    Quando o usuário descrever um GASTO (ex: "iFood 47", "Uber 23,50"), \
    devolva EXATAMENTE este JSON em uma única linha, sem texto extra:
    {"type":"expense","merchant":"<nome>","amount":<número>,"category":"<Delivery|Mercado|Mobilidade|Saúde|Assinaturas|Combustível|Outros>"}

    Quando o usuário pedir análise de hábitos / 6 meses / relatório, devolva:
    {"type":"insight","title":"<titulo curto>","body":"<1-2 frases>","action":"Ver plano","navigateTo":"overview"}

    Caso contrário, responda em texto livre, em pt-BR, no tom do Du.
    """

    init(kind: ChatBackendKind, config: ModelConfig) {
        self.kind = kind
        self.config = config
    }

    func prepare() async throws {
        if client != nil { return }
        guard let modelURL = Bundle.main.url(
            forResource: (config.ggufFileName as NSString).deletingPathExtension,
            withExtension: "gguf"
        ) else {
            throw BackendError.modelNotBundled(config.ggufFileName)
        }
        // Tight context + low temp keep memory pressure down on 4 GB devices
        // and bias the model toward terse, JSON-friendly replies.
        let llama = try await LocalLLMClient.llama(
            url: modelURL,
            parameter: .init(
                context: 1024,
                temperature: 0.4,
                topK: 40,
                topP: 0.9
            )
        )
        client = AnyLLMClient(llama)
    }

    nonisolated func reply(to message: String, history: [ChatMessage]) -> AsyncThrowingStream<ChatStreamEvent, Error> {
        AsyncThrowingStream { continuation in
            Task { @MainActor in
                do {
                    try await self.prepare()
                    guard let client = self.client else {
                        continuation.finish(throwing: BackendError.modelNotReady); return
                    }

                    let start = DispatchTime.now()
                    var firstTokenAt: DispatchTime?
                    var assembled = ""
                    var outputTokens = 0

                    let chatInput = Self.buildChatInput(history: history, userMessage: message)
                    let stream = try await client.textStream(from: chatInput)

                    for try await chunk in stream {
                        if firstTokenAt == nil { firstTokenAt = DispatchTime.now() }
                        assembled += chunk
                        outputTokens += 1

                        // Suppress live streaming when we suspect a JSON payload —
                        // we'd rather render it as a card after parsing than show
                        // raw braces drift in.
                        if !assembled.trimmingCharacters(in: .whitespaces).hasPrefix("{") {
                            continuation.yield(.textChunk(chunk))
                        }
                    }

                    let firstTokenMs = firstTokenAt.map {
                        Int(Double($0.uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000)
                    } ?? 0
                    let totalMs = Int(Double(DispatchTime.now().uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000)

                    let parseResult = Self.parseStructuredOutput(assembled)
                    if let event = parseResult.event {
                        continuation.yield(event)
                    } else {
                        let trimmed = assembled.trimmingCharacters(in: .whitespacesAndNewlines)
                        if !trimmed.isEmpty {
                            continuation.yield(.finalText(trimmed))
                        }
                    }

                    continuation.yield(.done(BackendStats(
                        firstTokenMs: firstTokenMs,
                        totalMs: totalMs,
                        outputTokens: outputTokens,
                        parseSuccess: parseResult.event != nil || parseResult.expectedFreeform
                    )))
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    // MARK: - Prompt assembly

    private static func buildChatInput(history: [ChatMessage], userMessage: String) -> LLMInput {
        var messages: [LLMInput.Message] = [.system(systemPrompt)]
        // Trim to last 4 turns to keep KV cache small on 4 GB devices.
        for msg in history.suffix(4) {
            guard case .text(let t) = msg.content else { continue }
            switch msg.who {
            case .me: messages.append(.user(t))
            case .du: messages.append(.assistant(t))
            }
        }
        messages.append(.user(userMessage))
        return .chat(messages)
    }

    // MARK: - Output parsing

    private struct ParseResult {
        let event: ChatStreamEvent?
        let expectedFreeform: Bool   // true if response wasn't supposed to be JSON anyway
    }

    private static func parseStructuredOutput(_ raw: String) -> ParseResult {
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

enum BackendError: LocalizedError {
    case modelNotBundled(String)
    case modelNotReady

    var errorDescription: String? {
        switch self {
        case .modelNotBundled(let file):
            return "Modelo \(file) não está empacotado. Rode scripts/fetch-model.sh."
        case .modelNotReady:
            return "Modelo não foi carregado."
        }
    }
}
