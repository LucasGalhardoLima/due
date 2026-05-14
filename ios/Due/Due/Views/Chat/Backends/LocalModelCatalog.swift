import Foundation

// Per-model metadata used by `LocalLlamaCppBackend`. The GGUF file ships
// inside the app bundle at `Resources/Models/<ggufFileName>`. The chat
// template is auto-detected from GGUF metadata by LocalLLMClient.
struct ModelConfig: Sendable {
    let id: String              // logged in benchmark JSONL as `model_id`
    let displayName: String
    let ggufFileName: String    // bundled file, e.g. "qwen3-0.6b-q4_k_m.gguf"
}

enum LocalModelCatalog {
    static func config(for kind: ChatBackendKind) -> ModelConfig? {
        switch kind {
        case .ruleBased: return nil
        case .qwen3_06b:
            return ModelConfig(
                id: "qwen3-0.6b",
                displayName: "Qwen 3 0.6B Q4_K_M",
                ggufFileName: "qwen3-0.6b-q4_k_m.gguf")
        case .qwen35_08b:
            return ModelConfig(
                id: "qwen3.5-0.8b",
                displayName: "Qwen 3.5 0.8B Q4_K_M",
                ggufFileName: "qwen3.5-0.8b-q4_k_m.gguf")
        case .gemma3_1b:
            return ModelConfig(
                id: "gemma3-1b",
                displayName: "Gemma 3 1B Q4_K_M",
                ggufFileName: "gemma3-1b-q4_k_m.gguf")
        case .llama32_1b:
            return ModelConfig(
                id: "llama3.2-1b",
                displayName: "Llama 3.2 1B Q4_K_M",
                ggufFileName: "llama3.2-1b-q4_k_m.gguf")
        }
    }
}
