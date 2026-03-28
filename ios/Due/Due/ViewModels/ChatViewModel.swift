import Foundation
import Clerk

@MainActor
@Observable
final class ChatViewModel {
    var messages: [Message] = []
    var isStreaming = false
    var error: String?
    var errorKind: ErrorKind?

    private let api = APIClient.shared

    var hasMessages: Bool { !messages.isEmpty }

    // MARK: - Send Message

    func send(_ text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        let userMessage = Message(role: .user, content: trimmed)
        messages.append(userMessage)

        let assistantMessage = Message(role: .assistant, content: "")
        messages.append(assistantMessage)
        isStreaming = true
        error = nil
        errorKind = nil

        do {
            try await streamResponse(for: trimmed, into: assistantMessage.id)
        } catch {
            // Remove empty assistant message on failure
            if let idx = messages.lastIndex(where: { $0.id == assistantMessage.id }),
               messages[idx].content.isEmpty {
                messages.remove(at: idx)
            }
            self.error = error.localizedDescription
            self.errorKind = (error as? APIError)?.kind ?? .loadFailure
        }

        isStreaming = false
    }

    // MARK: - SSE Streaming

    private func streamResponse(for prompt: String, into messageId: UUID) async throws {
        guard let token = try await Clerk.shared.session?.getToken()?.jwt else {
            throw APIError.noSession
        }

        let endpoint = Endpoint.chatStream()
        guard let url = endpoint.url else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ChatRequest(
            messages: messages.dropLast().map { ChatRequest.RequestMessage(role: $0.role.rawValue, content: $0.content) }
        )
        request.httpBody = try JSONEncoder().encode(body)

        let (bytes, response) = try await URLSession.shared.bytes(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
            throw APIError.httpError(statusCode: statusCode, message: "Chat request failed")
        }

        for try await line in bytes.lines {
            // Vercel AI SDK data stream format: "0:\"text chunk\"\n"
            guard line.hasPrefix("0:") else { continue }

            let payload = String(line.dropFirst(2))
            // Payload is a JSON-encoded string like "\"hello \""
            if let data = payload.data(using: .utf8),
               let text = try? JSONDecoder().decode(String.self, from: data) {
                if let idx = messages.firstIndex(where: { $0.id == messageId }) {
                    messages[idx].content += text
                }
            }
        }
    }

    // MARK: - Clear

    func clearChat() {
        messages.removeAll()
        error = nil
        errorKind = nil
    }
}

// MARK: - Request Types

private struct ChatRequest: Encodable {
    let messages: [RequestMessage]

    struct RequestMessage: Encodable {
        let role: String
        let content: String
    }
}
