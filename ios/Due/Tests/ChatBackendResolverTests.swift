import Testing
@testable import Du

@MainActor
struct ChatBackendResolverTests {
    @Test
    func chatBackendKindIsThreeCasesIncludingAuto() {
        let cases = ChatBackendKind.allCases
        #expect(cases.count == 3)
        #expect(cases.contains(.auto))
        #expect(cases.contains(.ruleBased))
        #expect(cases.contains(.appleFoundationModels))
    }

    // The resolver always returns a concrete tier — never `.auto`, never crashes.
    // Which tier depends on the simulator:
    //   - iOS 26+ with Apple Intelligence available → .appleFoundationModels
    //   - everything else → .ruleBased
    @Test
    func resolverNeverReturnsAutoAndNeverCrashes() {
        let backend = ChatBackendResolver.resolve()
        #expect(backend.kind != .auto)
        #expect([ChatBackendKind.appleFoundationModels, .ruleBased].contains(backend.kind))
    }
}
