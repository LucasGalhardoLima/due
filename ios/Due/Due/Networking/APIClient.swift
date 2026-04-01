import Foundation
import Clerk

@MainActor
@Observable
final class APIClient {
    static let shared = APIClient()

    private let urlSession: URLSession
    private let decoder: JSONDecoder

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        self.urlSession = URLSession(configuration: config)

        self.decoder = JSONDecoder()
    }

    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        try await performRequest(endpoint, body: Optional<EmptyBody>.none)
    }

    func request<T: Decodable, B: Encodable>(_ endpoint: Endpoint, body: B) async throws -> T {
        try await performRequest(endpoint, body: body)
    }


    private func performRequest<T: Decodable, B: Encodable>(_ endpoint: Endpoint, body: B?) async throws -> T {
        guard let url = endpoint.url else {
            throw APIError.invalidURL
        }

        guard let token = try await Clerk.shared.session?.getToken()?.jwt else {
            // Session lost — sign out so AuthGateView redirects to login
            try? await Clerk.shared.signOut()
            throw APIError.noSession
        }

        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        #if DEBUG
        print("[API] \(endpoint.method.rawValue) \(url)")
        #endif

        let data: Data
        let response: URLResponse

        do {
            (data, response) = try await urlSession.data(for: request)
        } catch {
            #if DEBUG
            print("[API] Network error: \(error)")
            #endif
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(URLError(.badServerResponse))
        }

        #if DEBUG
        if !(200...299).contains(httpResponse.statusCode) {
            let body = String(data: data.prefix(500), encoding: .utf8) ?? "<binary>"
            print("[API] HTTP \(httpResponse.statusCode) — \(body)")
        }
        #endif

        guard (200...299).contains(httpResponse.statusCode) else {
            let message = try? decoder.decode(ErrorResponse.self, from: data).message
            let apiError = APIError.httpError(statusCode: httpResponse.statusCode, message: message)

            // Auto sign-out on 401/403 so AuthGateView redirects to login
            if httpResponse.statusCode == 401 || httpResponse.statusCode == 403 {
                try? await Clerk.shared.signOut()
            }

            throw apiError
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }
}

private struct EmptyBody: Encodable {}

private struct ErrorResponse: Decodable {
    let message: String?
}
