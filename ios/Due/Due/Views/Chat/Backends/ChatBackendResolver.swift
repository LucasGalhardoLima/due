import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

// Single decision point for which chat backend to instantiate when the
// user's preference is `.auto`.
//
// Tier order, top wins:
//   1. AppleFoundationModelsBackend — iOS 26+, Apple Intelligence enabled.
//   2. RuleBasedBackend — deterministic, instant, no model required.
@MainActor
enum ChatBackendResolver {
    static func resolve() -> any ChatBackend {
        #if canImport(FoundationModels)
        if isFoundationModelsAvailable() {
            return AppleFoundationModelsBackend()
        }
        #endif
        return RuleBasedBackend()
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
