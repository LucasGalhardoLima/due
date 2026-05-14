import Foundation

// One enum per chat option visible in Settings. The user picks one;
// the view-model spins up the right backend. Adding a model = add a
// case here + a `ModelConfig` entry in `LocalModelCatalog`.
enum ChatBackendKind: String, CaseIterable, Identifiable, Codable {
    case ruleBased
    case qwen3_06b
    case qwen35_08b
    case gemma3_1b
    case llama32_1b

    var id: String { rawValue }

    /// The runtime family. Used by the benchmark logger and to decide
    /// which backend implementation to instantiate.
    var family: BackendFamily {
        switch self {
        case .ruleBased: return .rules
        default:         return .llamaCpp
        }
    }

    var label: String {
        switch self {
        case .ruleBased: return "Regras"
        case .qwen3_06b: return "Qwen 3 0.6B"
        case .qwen35_08b: return "Qwen 3.5 0.8B"
        case .gemma3_1b: return "Gemma 3 1B"
        case .llama32_1b: return "Llama 3.2 1B"
        }
    }

    var subtitle: String {
        switch self {
        case .ruleBased: return "Padrões hard-coded — rápido, previsível, sem IA"
        case .qwen3_06b: return "On-device · Q4_K_M · ~400 MB · pt-BR forte"
        case .qwen35_08b: return "On-device · Q4_K_M · ~500 MB · mais capaz"
        case .gemma3_1b: return "On-device · Q4_K_M · ~700 MB · multilíngue"
        case .llama32_1b: return "On-device · Q4_K_M · ~700 MB · base Meta"
        }
    }
}

enum BackendFamily: String, Codable {
    case rules
    case llamaCpp
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
