import Foundation

@MainActor
@Observable
final class InstallmentsViewModel {
    var timeline: InstallmentTimelineResponse?
    var health: InstallmentHealthResponse?
    var isLoading = false
    var error: String?
    var errorKind: ErrorKind?

    private let api = APIClient.shared

    func load() async {
        isLoading = true
        error = nil
        errorKind = nil

        do {
            timeline = try await api.request(.installmentsTimeline())
        } catch {
            self.error = error.localizedDescription
            self.errorKind = (error as? APIError)?.kind ?? .loadFailure
        }

        do {
            health = try await api.request(.installmentsHealth())
        } catch {
            // Health failure is non-critical
        }

        isLoading = false
    }
}
