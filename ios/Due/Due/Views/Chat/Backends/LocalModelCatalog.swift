import Foundation

// Per-model metadata used by `LocalLlamaCppBackend`. The GGUF file ships
// inside the app bundle at `Resources/Models/<ggufFileName>`. The chat
// template is auto-detected from GGUF metadata by LocalLLMClient.
//
// v1 ships ONE bundled model (Qwen 3 0.6B Q4_K_M, ~440 MB) — the universal
// fallback for devices without Apple Intelligence. The earlier 4-model
// A/B harness lives in git history; bring it back if/when we benchmark
// alternatives again.
struct ModelConfig: Sendable {
    let id: String              // logged in benchmark JSONL as `model_id`
    let displayName: String
    let ggufFileName: String    // bundled file, e.g. "qwen3-0.6b-q4_k_m.gguf"
}

enum LocalModelCatalog {
    static let qwen06b = ModelConfig(
        id: "qwen3-0.6b",
        displayName: "Qwen 3 0.6B Q4_K_M",
        ggufFileName: "qwen3-0.6b-q4_k_m.gguf"
    )

    static func config(for kind: ChatBackendKind) -> ModelConfig? {
        switch kind {
        case .llamaQwen06b: return qwen06b
        case .auto, .ruleBased, .appleFoundationModels: return nil
        }
    }
}
