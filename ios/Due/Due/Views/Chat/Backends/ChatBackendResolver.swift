import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

// Single decision point for which chat backend to instantiate. Called
// when the user's preference is `.auto`, or as a graceful-fallback when
// a forced choice (`.appleFoundationModels`, `.llamaQwen06b`) can't
// actually run on this device.
//
// Tier order, top wins:
//   1. AppleFoundationModelsBackend — iOS 26+, Apple Intelligence
//      enabled, SystemLanguageModel.default.availability == .available.
//   2. LocalLlamaCppBackend(qwen06b) — the GGUF is bundled at
//      Resources/Models/qwen3-0.6b-q4_k_m.gguf. Universal across
//      iOS 17+/A12+ devices.
//   3. RuleBasedBackend — instant, deterministic, no model. Used when
//      neither of the above is available (older device + GGUF not yet
//      fetched/bundled).
@MainActor
enum ChatBackendResolver {
    static func resolve() -> any ChatBackend {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *), isFoundationModelsAvailable() {
            return AppleFoundationModelsBackend()
        }
        #endif

        if hasBundledLlamaModel() {
            return LocalLlamaCppBackend(
                kind: .llamaQwen06b,
                config: LocalModelCatalog.qwen06b
            )
        }

        return RuleBasedBackend()
    }

    static func hasBundledLlamaModel() -> Bool {
        let name = (LocalModelCatalog.qwen06b.ggufFileName as NSString)
            .deletingPathExtension
        return Bundle.main.url(forResource: name, withExtension: "gguf") != nil
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, *)
    static func isFoundationModelsAvailable() -> Bool {
        switch SystemLanguageModel.default.availability {
        case .available: return true
        case .unavailable: return false
        }
    }
    #endif
}
