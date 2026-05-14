import Foundation

// User-facing chat backend choice. `.auto` defers to ChatBackendResolver,
// which picks the best tier available on the current device (Apple
// FoundationModels when iOS 26 + Apple Intelligence is available, else
// the bundled Qwen GGUF via llama.cpp, else the rule-based baseline).
// The other three cases are dev/QA overrides; in RELEASE the Settings
// picker is hidden entirely so end users always get `.auto`.
enum ChatBackendKind: String, CaseIterable, Identifiable, Codable {
    case auto
    case ruleBased
    case appleFoundationModels
    case llamaQwen06b

    var id: String { rawValue }

    /// The runtime family. Used by the benchmark logger and to decide
    /// which backend implementation to instantiate. `.auto` is resolved
    /// before this is read; backends themselves never report `.auto`.
    var family: BackendFamily {
        switch self {
        case .auto:                  return .auto
        case .ruleBased:             return .rules
        case .appleFoundationModels: return .appleFoundationModels
        case .llamaQwen06b:          return .llamaCpp
        }
    }

    var label: String {
        switch self {
        case .auto:                  return "Automático"
        case .ruleBased:             return "Regras"
        case .appleFoundationModels: return "Apple Intelligence"
        case .llamaQwen06b:          return "Qwen 3 0.6B"
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
        case .llamaQwen06b:
            return "On-device · Q4_K_M · ~440 MB · pt-BR forte · qualquer iPhone iOS 17+"
        }
    }
}

enum BackendFamily: String, Codable {
    case auto
    case rules
    case llamaCpp
    case appleFoundationModels
}

// Streamed reply: one token / chunk at a time, plus structured payloads
// the backend recognized (expense, insight, suggestions). The view model
// renders chunks live and appends structured cards as they arrive.
enum ChatStreamEvent: Sendable {
    case textChunk(String)             // append to the in-flight assistant bubble
    case finalText(String)             // commits the assistant text bubble (replaces in-flight)
    case structured(StructuredOutput)  // emits a rich card (expense / insight / etc)
    case suggestions([String])         // chip row
    case done(BackendStats)            // wraps up: latency / tokens
}

enum StructuredOutput: Sendable {
    case expense(ExpenseProposal)
    case insight(ChatInsight)
}

struct BackendStats: Sendable {
    let firstTokenMs: Int
    let totalMs: Int
    let outputTokens: Int
    let parseSuccess: Bool          // for backends that try structured output
}

// All backends conform to this. Each returns an async stream so the UI
// can render token-by-token where supported, and a single `.done(...)`
// closes the run for the logger.
protocol ChatBackend: Sendable {
    var kind: ChatBackendKind { get }
    /// Optional warmup (load model, initialize tokenizer). Safe to call repeatedly.
    func prepare() async throws
    func reply(to message: String, history: [ChatMessage]) -> AsyncThrowingStream<ChatStreamEvent, Error>
}
