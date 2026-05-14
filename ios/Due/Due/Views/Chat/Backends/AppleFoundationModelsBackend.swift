#if canImport(FoundationModels)
import Foundation
import FoundationModels
import LocalLLMClient
import LocalLLMClientFoundationModels

// Apple FoundationModels tier — runs the OS-bundled on-device LLM on
// iOS 26+ devices that have Apple Intelligence enabled (iPhone 15 Pro /
// 16-series and later; M-series iPad/Mac). Zero bundle cost: the model
// is part of the OS.
//
// Wire-up via ChatBackendResolver: when SystemLanguageModel's
// availability is `.available`, this is selected automatically; on
// any other device or iOS version the resolver falls back to the
// bundled Qwen GGUF via llama.cpp.
//
// The streaming + JSON-parse pipeline mirrors LocalLlamaCppBackend so
// the user-facing experience is identical regardless of which tier ran.
// We share the system prompt + structured-output parser via ChatPromptKit.
//
// Future polish: replace the JSON-in-prompt convention with @Generable
// schema constraints, which FoundationModels enforces at decode time
// (more reliable than asking nicely for JSON).
@available(iOS 26.0, *)
@MainActor
final class AppleFoundationModelsBackend: ChatBackend, Sendable {
    nonisolated let kind: ChatBackendKind = .appleFoundationModels

    private var client: FoundationModelsClient?

    func prepare() async throws {
        if client != nil { return }
        client = try await LocalLLMClient.foundationModels()
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

                    for await chunk in stream {
                        if firstTokenAt == nil { firstTokenAt = DispatchTime.now() }
                        assembled += chunk
                        outputTokens += 1

                        // Same JSON-buffering trick as the llama tier: suppress
                        // live streaming when the response is clearly a JSON
                        // payload — rendered as a card after parse.
                        if !assembled.trimmingCharacters(in: .whitespaces).hasPrefix("{") {
                            continuation.yield(.textChunk(chunk))
                        }
                    }

                    let firstTokenMs = firstTokenAt.map {
                        Int(Double($0.uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000)
                    } ?? 0
                    let totalMs = Int(Double(DispatchTime.now().uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000)

                    let parseResult = ChatPromptKit.parseStructuredOutput(assembled)
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

    private static func buildChatInput(history: [ChatMessage], userMessage: String) -> LLMInput {
        var messages: [LLMInput.Message] = [.system(ChatPromptKit.systemPrompt)]
        // Trim to last 4 turns. FoundationModels manages context internally
        // but trimming keeps prompt construction predictable across tiers.
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
}

#endif
