import Testing
@testable import Du

@MainActor
struct ChatBackendResolverTests {
    @Test
    func chatBackendKindIsFourCasesIncludingAuto() {
        let cases = ChatBackendKind.allCases
        #expect(cases.count == 4)
        #expect(cases.contains(.auto))
        #expect(cases.contains(.ruleBased))
        #expect(cases.contains(.appleFoundationModels))
        #expect(cases.contains(.llamaQwen06b))
    }

    @Test
    func localModelCatalogReturnsConfigOnlyForQwen() {
        #expect(LocalModelCatalog.config(for: .llamaQwen06b)?.id == "qwen3-0.6b")
        #expect(LocalModelCatalog.config(for: .auto) == nil)
        #expect(LocalModelCatalog.config(for: .ruleBased) == nil)
        #expect(LocalModelCatalog.config(for: .appleFoundationModels) == nil)
    }

    // The resolver always returns a concrete tier — never `.auto`,
    // never crashes. Which specific tier depends on the simulator:
    // - iPhone 17 / iOS 26.5: SystemLanguageModel is available, so we
    //   get .appleFoundationModels.
    // - Older sim or non-Apple-Intelligence device: drops to Llama if
    //   GGUF is bundled, else rules.
    // We don't pin a specific tier here because we want to run the
    // suite on every supported configuration.
    @Test
    func resolverNeverReturnsAutoAndNeverCrashes() {
        let backend = ChatBackendResolver.resolve()
        #expect(backend.kind != .auto)
        #expect([
            ChatBackendKind.appleFoundationModels,
            .llamaQwen06b,
            .ruleBased
        ].contains(backend.kind))
    }

    // Sanity: the resolver's bundle check resolves the GGUF that the
    // Du target now ships. The test target embeds the host bundle, so
    // `Bundle.main` here is the .app — same path the real resolver
    // looks at. If this flips to false, the model resource is no longer
    // being copied into the .app and the Llama tier will be silently
    // dead at runtime.
    @Test
    func bundledLlamaCheckResolvesShippedGguf() {
        #expect(ChatBackendResolver.hasBundledLlamaModel() == true)
    }
}
